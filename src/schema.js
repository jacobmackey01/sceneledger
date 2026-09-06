import { z } from "zod";

export const researchRequestSchema = z.object({
  title: z.string().trim().min(2).max(100),
  productionType: z.enum(["documentary", "scripted", "branded", "newsroom"]),
  brief: z.string().trim().min(40).max(5000),
  audience: z.string().trim().min(2).max(160).default("General audience"),
  cutoffDate: z.iso.date().optional(),
  mode: z.enum(["brief", "script"]).default("brief"),
  script: z.string().max(6000).default(""),
  followUp: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (value.mode !== "script") return;
  const lines = value.script.split(/\r\n|\n|\r/u).filter((line) => line.trim());
  if (!lines.length || lines.length > 20) ctx.addIssue({ code: "custom", path: ["script"], message: "Provide 1–20 non-empty narration lines." });
});

export const planSchema = z.object({
  researchQuestions: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(3),
      query: z.string().min(3),
      reason: z.string().min(3),
    }),
  ).min(2).max(5),
});

export const synthesisSchema = z.object({
  headline: z.string().min(3),
  summary: z.string().min(20),
  claims: z.array(
    z.object({
      claim: z.string().min(5),
      status: z.enum(["supported", "contested", "unverified"]),
      confidence: z.enum(["high", "medium", "low"]),
      evidence: z.array(
        z.object({
          sourceId: z.string().min(1),
          excerpt: z.string().min(1),
        }),
      ),
      productionUse: z.string().min(3),
      lineId: z.string().optional(),
      rationale: z.string().max(2000).optional(),
      suggestedWording: z.string().max(2000).nullable().optional(),
    }),
  ).min(1).max(40),
  risks: z.array(z.string()).max(8),
  openQuestions: z.array(z.string()).max(8),
});
