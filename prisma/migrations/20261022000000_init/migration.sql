CREATE TABLE "User" (
 "id" TEXT PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL,
 "passwordHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "profile" JSONB
);
CREATE TABLE "Session" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE TABLE "Lesson" (
 "id" TEXT PRIMARY KEY, "track" TEXT NOT NULL, "module" TEXT NOT NULL, "position" INTEGER NOT NULL,
 "title" TEXT NOT NULL, "description" TEXT NOT NULL, "minutes" INTEGER NOT NULL,
 "prerequisiteId" TEXT, "content" JSONB NOT NULL
);
CREATE INDEX "Lesson_track_position_idx" ON "Lesson"("track","position");
CREATE TABLE "Exercise" (
 "id" TEXT PRIMARY KEY, "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "position" INTEGER NOT NULL, "kind" TEXT NOT NULL, "prompt" TEXT NOT NULL, "answer" TEXT NOT NULL,
 "explanation" TEXT NOT NULL, "hints" JSONB NOT NULL, "starter" TEXT, "assumptions" JSONB
);
CREATE INDEX "Exercise_lessonId_position_idx" ON "Exercise"("lessonId","position");
CREATE TABLE "Attempt" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "exerciseId" TEXT NOT NULL REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "answer" TEXT NOT NULL, "correct" BOOLEAN NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Attempt_userId_createdAt_idx" ON "Attempt"("userId","createdAt");
CREATE INDEX "Attempt_userId_exerciseId_idx" ON "Attempt"("userId","exerciseId");
CREATE TABLE "Progress" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Progress_userId_lessonId_key" ON "Progress"("userId","lessonId");
CREATE TABLE "StudySession" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "endedAt" TIMESTAMP(3)
);
CREATE INDEX "StudySession_userId_startedAt_idx" ON "StudySession"("userId","startedAt");
