import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  currentUser,
  hashPassword,
  logout,
  verifyPassword,
} from "@/lib/auth";
import { rateLimit, sameOrigin } from "@/lib/security";
import { validateWolfram } from "@/lib/wolfram";
z.config(z.locales.bg());

export const runtime = "nodejs";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });
const registration = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(12, "Паролата трябва да има поне 12 знака.")
    .max(128),
  name: z.string().trim().min(2).max(80),
});
const login = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(128),
});
const profileSchema = z.object({
  level: z.enum(["beginner", "intermediate", "advanced"]),
  derivatives: z.boolean(),
  integrals: z.boolean(),
  equations: z.boolean(),
  wolfram: z.boolean(),
  subject: z.string().trim().min(1).max(120),
  examDate: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v)),
  grade: z.number().min(3).max(6),
  dailyMinutes: z.number().int().min(10).max(180),
});
async function readBody(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) throw new SyntaxError("Missing body");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16000) {
      await reader.cancel();
      throw new SyntaxError("Body too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function route(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api/", "").split("/");
  const isPost = req.method === "POST";
  if (isPost && !sameOrigin(req))
    return json({ error: "Невалиден източник на заявката." }, 403);
  if (isPost && Number(req.headers.get("content-length") || 0) > 16000)
    return json({ error: "Заявката е твърде голяма." }, 413);
  if (path[0] === "auth" && isPost) {
    if (path[1] === "logout") {
      await logout();
      return json({ ok: true });
    }
    // Global limiter also prevents spoofed forwarding headers from bypassing limits.
    if (
      !rateLimit("auth:global", 60) ||
      !rateLimit("auth:" + (req.headers.get("x-forwarded-for") || "local"), 15)
    )
      return json({ error: "Твърде много опити. Изчакай една минута." }, 429);
    if (path[1] === "register") {
      const data = registration.parse(await readBody(req));
      if (await db.user.findUnique({ where: { email: data.email } }))
        return json(
          { error: "Не може да се създаде профил с тези данни." },
          409,
        );
      const user = await db.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash: await hashPassword(data.password),
        },
      });
      await createSession(user.id);
      return json({ ok: true }, 201);
    }
    if (path[1] === "login") {
      const data = login.parse(await readBody(req));
      const user = await db.user.findUnique({ where: { email: data.email } });
      if (!user || !(await verifyPassword(data.password, user.passwordHash)))
        return json({ error: "Невалиден имейл или парола." }, 401);
      await createSession(user.id);
      return json({ ok: true });
    }
  }
  const user = await currentUser();
  if (!user) return json({ error: "Влез в профила си." }, 401);
  if (!rateLimit("user:" + user.id, isPost ? 60 : 240))
    return json({ error: "Твърде много заявки. Опитай след минута." }, 429);
  if (path[0] === "profile" && isPost) {
    const profile = profileSchema.parse(await readBody(req));
    await db.user.update({ where: { id: user.id }, data: { profile } });
    return json({ ok: true });
  }
  if (path[0] === "dashboard" && !isPost) {
    const [lessons, progress, attempts] = await Promise.all([
      db.lesson.findMany({
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          track: true,
          module: true,
          minutes: true,
          prerequisiteId: true,
          _count: { select: { exercises: true } },
        },
      }),
      db.progress.findMany({ where: { userId: user.id } }),
      db.attempt.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          exerciseId: true,
          correct: true,
          createdAt: true,
          exercise: { select: { lessonId: true, prompt: true, kind: true } },
        },
      }),
    ]);
    return json({
      user: { name: user.name, email: user.email, profile: user.profile },
      lessons,
      progress,
      attempts,
    });
  }
  if (path[0] === "lessons" && path[1] && !isPost) {
    const lesson = await db.lesson.findUnique({
      where: { id: path[1] },
      include: {
        exercises: {
          orderBy: { position: "asc" },
          select: { id: true, kind: true, prompt: true, starter: true },
        },
      },
    });
    if (!lesson) return json({ error: "Урокът не е намерен." }, 404);
    const solved = await db.attempt.findMany({
      where: {
        userId: user.id,
        correct: true,
        exercise: { lessonId: lesson.id },
      },
      distinct: ["exerciseId"],
      select: { exerciseId: true },
    });
    return json({ ...lesson, solved: solved.map((a) => a.exerciseId) });
  }
  if (path[0] === "exercises" && path[1] && isPost) {
    const exercise = await db.exercise.findUnique({ where: { id: path[1] } });
    if (!exercise) return json({ error: "Задачата не е намерена." }, 404);
    if (path[2] === "hint") {
      const { level } = z
        .object({ level: z.number().int().min(0).max(2) })
        .parse(await readBody(req));
      return json({ hint: (exercise.hints as string[])[level] });
    }
    if (path[2] === "solution")
      return json({
        answer: exercise.answer,
        explanation: exercise.explanation,
      });
    if (path[2] === "check") {
      const { answer } = z
        .object({
          answer: z
            .string()
            .trim()
            .min(1)
            .max(exercise.kind === "wolfram" ? 1000 : 256),
        })
        .parse(await readBody(req));
      let result: { correct: boolean; message: string };
      if (exercise.kind === "wolfram")
        result = validateWolfram(answer, exercise.answer);
      else {
        try {
          const response = await fetch(
            `${process.env.MATH_SERVICE_URL || "http://127.0.0.1:8001"}/verify`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answer, expected: exercise.answer }),
              signal: AbortSignal.timeout(5000),
            },
          );
          const data = await response.json();
          if (!response.ok)
            return json(
              {
                error:
                  typeof data.detail === "string"
                    ? data.detail
                    : "Неподдържан математически израз.",
              },
              422,
            );
          result = data;
        } catch {
          return json(
            {
              error:
                "Математическата проверка е временно недостъпна. Опитът не е оценен.",
            },
            503,
          );
        }
      }
      await db.attempt.create({
        data: {
          userId: user.id,
          exerciseId: exercise.id,
          answer,
          correct: result.correct,
        },
      });
      const [total, solved] = await Promise.all([
        db.exercise.count({ where: { lessonId: exercise.lessonId } }),
        db.attempt.findMany({
          where: {
            userId: user.id,
            correct: true,
            exercise: { lessonId: exercise.lessonId },
          },
          distinct: ["exerciseId"],
          select: { exerciseId: true },
        }),
      ]);
      const completed = total > 0 && solved.length === total;
      if (completed)
        await db.progress.upsert({
          where: {
            userId_lessonId: { userId: user.id, lessonId: exercise.lessonId },
          },
          create: { userId: user.id, lessonId: exercise.lessonId },
          update: {},
        });
      return json({
        ...result,
        completed,
        explanation: result.correct ? exercise.explanation : undefined,
      });
    }
  }
  if (path[0] === "study" && isPost) {
    const body = z
      .object({ action: z.enum(["start", "end"]), id: z.string().optional() })
      .parse(await readBody(req));
    if (body.action === "start") {
      const session = await db.studySession.create({
        data: { userId: user.id },
      });
      return json({ id: session.id });
    }
    if (body.id)
      await db.studySession.updateMany({
        where: { id: body.id, userId: user.id, endedAt: null },
        data: { endedAt: new Date() },
      });
    return json({ ok: true });
  }
  return json({ error: "Ресурсът не е намерен." }, 404);
}
async function handler(req: NextRequest) {
  try {
    return await route(req);
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        { error: error.issues[0]?.message || "Невалидни данни." },
        400,
      );
    if (error instanceof SyntaxError)
      return json({ error: "Невалидна заявка." }, 400);
    console.error(
      JSON.stringify({
        level: "error",
        event: "api_failure",
        path: req.nextUrl.pathname,
        type: error instanceof Error ? error.name : "Unknown",
      }),
    );
    return json({ error: "Възникна грешка. Опитай отново." }, 500);
  }
}
export { handler as GET, handler as POST };
