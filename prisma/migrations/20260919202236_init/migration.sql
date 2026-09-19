-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "DataStructure" AS ENUM ('ARRAY', 'STRING', 'HASH_MAP', 'HASH_SET', 'LINKED_LIST', 'STACK', 'QUEUE', 'DEQUE', 'HEAP', 'BINARY_TREE', 'BINARY_SEARCH_TREE', 'TRIE', 'GRAPH', 'MATRIX', 'UNION_FIND', 'SEGMENT_TREE', 'FENWICK_TREE', 'BIT_MANIPULATION');

-- CreateEnum
CREATE TYPE "AlgorithmicTechnique" AS ENUM ('TWO_POINTERS', 'SLIDING_WINDOW', 'BINARY_SEARCH', 'DFS', 'BFS', 'TOPOLOGICAL_SORT', 'BACKTRACKING', 'DYNAMIC_PROGRAMMING', 'GREEDY', 'DIVIDE_AND_CONQUER', 'RECURSION', 'SORTING', 'PREFIX_SUM', 'MONOTONIC_STACK', 'FAST_SLOW_POINTERS', 'INTERVALS', 'MEMOIZATION', 'SIMULATION');

-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('O_1', 'O_LOG_N', 'O_SQRT_N', 'O_N', 'O_N_LOG_N', 'O_N_SQUARED', 'O_N_CUBED', 'O_2_POW_N', 'O_N_FACTORIAL', 'O_N_TIMES_M');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('DATA_STRUCTURE', 'TECHNIQUE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalFullyCorrect" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "leetcodeId" INTEGER,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_answers" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "primaryDataStructure" "DataStructure" NOT NULL,
    "acceptedDataStructures" "DataStructure"[],
    "primaryTechnique" "AlgorithmicTechnique" NOT NULL,
    "acceptedTechniques" "AlgorithmicTechnique"[],
    "primaryTimeComplexity" "Complexity" NOT NULL,
    "acceptedTimeComplexities" "Complexity"[],
    "primarySpaceComplexity" "Complexity" NOT NULL,
    "acceptedSpaceComplexities" "Complexity"[],
    "approachSummary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edge_cases" (
    "id" TEXT NOT NULL,
    "referenceAnswerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "matchers" TEXT[],
    "explanation" TEXT,

    CONSTRAINT "edge_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "selectedDataStructure" "DataStructure" NOT NULL,
    "selectedTechnique" "AlgorithmicTechnique" NOT NULL,
    "selectedTimeComplexity" "Complexity" NOT NULL,
    "selectedSpaceComplexity" "Complexity" NOT NULL,
    "edgeCasesText" TEXT NOT NULL,
    "dataStructureCorrect" BOOLEAN NOT NULL,
    "techniqueCorrect" BOOLEAN NOT NULL,
    "timeComplexityCorrect" BOOLEAN NOT NULL,
    "spaceComplexityCorrect" BOOLEAN NOT NULL,
    "edgeCasesCorrect" BOOLEAN NOT NULL,
    "isFullyCorrect" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "feedback" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_category_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "key" TEXT NOT NULL,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_category_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_entries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "signals" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codex_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "problems_leetcodeId_key" ON "problems"("leetcodeId");

-- CreateIndex
CREATE INDEX "problems_difficulty_idx" ON "problems"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "reference_answers_problemId_key" ON "reference_answers"("problemId");

-- CreateIndex
CREATE INDEX "edge_cases_referenceAnswerId_idx" ON "edge_cases"("referenceAnswerId");

-- CreateIndex
CREATE INDEX "attempts_userId_createdAt_idx" ON "attempts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "attempts_problemId_idx" ON "attempts"("problemId");

-- CreateIndex
CREATE INDEX "user_category_stats_userId_kind_idx" ON "user_category_stats"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "user_category_stats_userId_kind_key_key" ON "user_category_stats"("userId", "kind", "key");

-- CreateIndex
CREATE UNIQUE INDEX "codex_entries_slug_key" ON "codex_entries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "codex_entries_kind_key_key" ON "codex_entries"("kind", "key");

-- AddForeignKey
ALTER TABLE "reference_answers" ADD CONSTRAINT "reference_answers_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edge_cases" ADD CONSTRAINT "edge_cases_referenceAnswerId_fkey" FOREIGN KEY ("referenceAnswerId") REFERENCES "reference_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_category_stats" ADD CONSTRAINT "user_category_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
