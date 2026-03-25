export const CANVAS_TOOLS = [
  {
    name: "create_canvas",
    description: "Create a new interactive Canvas with a React/HTML component for live preview. Use when user requests a full UI component, page, layout, or dashboard.",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Complete component code with default export"
        },
        language: {
          type: "string",
          enum: ["tsx", "jsx", "html"],
          description: "Code language"
        },
        title: {
          type: "string",
          description: "Component name (e.g., 'LoginForm')"
        }
      },
      required: ["code", "language"]
    }
  },
  {
    name: "update_canvas",
    description: "Update Canvas with block-based patches or full rewrite. Use patches for targeted fixes, full rewrite for major changes.",
    parameters: {
      type: "object",
      properties: {
        patches: {
          type: "array",
          description: "Array of code patches to apply (block_replace based on exact oldCode matching)",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["block_replace", "insert", "delete", "full_rewrite"],
                description: "Type of patch operation"
              },
              oldCode: {
                type: "string",
                description: "Exact code block to match (required for block_replace)"
              },
              newCode: {
                type: "string",
                description: "New code to insert/replace"
              },
              explanation: {
                type: "string",
                description: "What this patch does"
              }
            },
            required: ["type"]
          }
        },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Confidence in patch accuracy. high/medium: apply patches. low: use fullCode directly."
        },
        fullCode: {
          type: "string",
          description: "Complete rewritten code (required if confidence is low, or as fallback)"
        },
        summary: {
          type: "string",
          description: "Brief summary of changes made"
        }
      },
      required: ["confidence"]
    }
  }
];
