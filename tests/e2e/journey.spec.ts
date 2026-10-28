import { test, expect } from "@playwright/test";
test("student registers, learns, receives validated feedback, and resumes progress", async ({
  page,
}) => {
  const email = `student-${Date.now()}@example.com`,
    password = "Test-passphrase-2026!";
  await page.goto("/register");
  await page.getByLabel("Име", { exact: true }).fill("Тест Студент");
  await page.getByLabel("Имейл", { exact: true }).fill(email);
  await page.getByLabel("Парола", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Създай профил" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page
    .getByRole("button", { name: "Към моето учебно пространство" })
    .click();
  await expect(
    page.getByRole("heading", { name: /Здравей, Тест/ }),
  ).toBeVisible();
  await page.goto("/lessons/separable");
  await expect(
    page.getByRole("heading", {
      name: "Уравнения с разделящи се променливи",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Опитай самостоятелно" }).click();
  const first = page.locator(".exercise").nth(0);
  await first.getByRole("button", { name: /Подсказка/ }).click();
  await expect(first.getByText(/Започни с dy\/y/)).toBeVisible();
  await first.getByRole("textbox").fill("exp(2*x)");
  await first.getByRole("button", { name: "Провери отговора" }).click();
  await expect(first.getByRole("status")).toContainText("Още не е вярно");
  for (const [i, answer] of ["6*exp(2*x)/2", "2*exp(-x)", "0"].entries()) {
    const exercise = page.locator(".exercise").nth(i);
    await exercise.getByRole("textbox").fill(answer);
    await exercise.getByRole("button", { name: "Провери отговора" }).click();
    await expect(exercise.getByRole("status")).toContainText("Вярно");
  }
  await expect(
    page.getByText("Урокът е завършен!", { exact: true }),
  ).toBeVisible();
  await page.goto("/lessons/wl-syntax");
  await page.getByRole("button", { name: "Опитай самостоятелно" }).click();
  for (const [i, answer] of ["Sqrt[9]", "1/3", "{1,2,3}"].entries()) {
    const exercise = page.locator(".exercise").nth(i);
    await exercise.getByLabel("Wolfram отговор", { exact: true }).fill(answer);
    await exercise.getByRole("button", { name: "Провери отговора" }).click();
    await expect(exercise.getByRole("status")).toContainText(
      "Кодът не е изпълняван",
    );
  }
  await expect(
    page.getByText("Урокът е завършен!", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Изход от профила" }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Имейл", { exact: true }).fill(email);
  await page.getByLabel("Парола", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Влез в профила" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator(".stat").nth(1)).toContainText("2 / 23");
  await page.goto("/lessons/separable");
  await expect(
    page.getByText("Урокът е завършен!", { exact: true }),
  ).toBeVisible();
  const data = await page.request.get("/api/dashboard");
  expect(data.ok()).toBe(true);
  const state = await data.json();
  expect(state.progress).toHaveLength(2);
});
test("authorization, CSRF and answer privacy", async ({ request }) => {
  expect((await request.get("/api/dashboard")).status()).toBe(401);
  expect(
    (
      await request.post("/api/auth/register", {
        headers: { origin: "https://evil.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.get("/api/exercises/separable-1/solution")).status(),
  ).toBe(401);
});
test("mobile authentication layout fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await expect(
    page.getByRole("button", { name: "Създай профил" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("authenticated mobile navigation, theme and graph remain functional", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await page.getByLabel("Име", { exact: true }).fill("Мобилен Студент");
  await page
    .getByLabel("Имейл", { exact: true })
    .fill(`mobile-${Date.now()}@example.com`);
  await page
    .getByLabel("Парола", { exact: true })
    .fill("Mobile-passphrase-2026!");
  await page.getByRole("button", { name: "Създай профил" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page
    .getByRole("button", { name: "Към моето учебно пространство" })
    .click();
  await expect(page.getByRole("heading", { name: /Здравей/ })).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".sidebar")
        .evaluate((el) => el.getBoundingClientRect().right),
    )
    .toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Смени темата" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Отвори менюто" }).click();
  await page.getByRole("link", { name: "Визуална лаборатория" }).click();
  await expect(page.locator(".plot .main-svg").first()).toBeVisible();
  await page.getByLabel("Параметър k", { exact: true }).fill("0.5");
  await expect(page.locator(".graph-panel code")).toContainText("0.5");
  await page.goto("/lessons/wl-syntax");
  await page.getByRole("button", { name: "Опитай самостоятелно" }).click();
  await expect(page.locator(".monaco-editor").first()).toBeVisible();
  const response = await page.request.get("/api/lessons/wl-syntax");
  const lesson = await response.json();
  expect(lesson.exercises[0]).not.toHaveProperty("answer");
  expect(lesson.exercises[0]).not.toHaveProperty("explanation");
});
