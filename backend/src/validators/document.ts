import { z } from "zod";

const diagramNodeSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.literal("architecture"),
  position: z.object({ x: z.number().finite().min(-100000).max(100000), y: z.number().finite().min(-100000).max(100000) }),
  data: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional()
  }).passthrough()
}).passthrough();

const diagramEdgeSchema = z.object({
  id: z.string().min(1).max(100),
  source: z.string().min(1).max(100),
  target: z.string().min(1).max(100),
  type: z.string().max(40).optional(),
  sourceHandle: z.string().max(100).nullable().optional(),
  targetHandle: z.string().max(100).nullable().optional(),
  markerEnd: z.any().optional()
}).passthrough();

const diagramAttrsSchema = z.object({
  nodes: z.array(diagramNodeSchema).max(100),
  edges: z.array(diagramEdgeSchema).max(200)
});

export const tiptapNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    type: z.enum([
      "doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem",
      "table", "tableRow", "tableHeader", "tableCell", "hardBreak", "architectureDiagram"
    ]),
    attrs: z.record(z.any()).optional(),
    text: z.string().max(10000).optional(),
    marks: z.array(z.object({
      type: z.enum(["bold", "italic", "underline"]),
      attrs: z.record(z.any()).optional()
    })).optional(),
    content: z.array(tiptapNodeSchema).optional()
  }).passthrough().superRefine((node, context) => {
    if (node.type !== "architectureDiagram") return;
    const parsed = diagramAttrsSchema.safeParse(node.attrs);
    if (!parsed.success) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid architecture diagram data" });
      return;
    }
    const ids = new Set(parsed.data.nodes.map(item => item.id));
    if (ids.size !== parsed.data.nodes.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Diagram node IDs must be unique" });
    }
    const edgeIds = new Set(parsed.data.edges.map(item => item.id));
    if (edgeIds.size !== parsed.data.edges.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Diagram connection IDs must be unique" });
    }
    if (parsed.data.edges.some(edge => !ids.has(edge.source) || !ids.has(edge.target))) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Diagram connections must reference existing nodes" });
    }
  })
);

export const createRevisionSchema = z.object({
  editorName: z.string().trim().min(1).max(60),
  content: tiptapNodeSchema.refine((value) => value.type === "doc", "Content must be a Tiptap document"),
  expectedCurrentVersion: z.number().int().positive()
});
