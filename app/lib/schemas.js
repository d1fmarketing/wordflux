import { z } from 'zod';

// Board operation schemas
export const boardOps = {
  create_card: z.object({
    columnId: z.string().min(1, 'Column ID required'),
    title: z.string().min(1, 'Title required').max(100, 'Title too long'),
    description: z.string().max(2000, 'Description too long').optional().default(''),
    owner: z.string().max(50, 'Owner too long').optional().default(''),
    priority: z.enum(['h', 'm', 'l']).optional().default('m'),
    // New fields
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
    dueDate: z.string().optional(),
    points: z.number().optional()
  }),
  
  update_card: z.object({
    // Support both patterns
    columnId: z.string().optional(),
    cardId: z.string().optional(),
    id: z.string().optional(),
    // Direct fields (backward compat)
    title: z.string().min(1).max(100, 'Title too long').optional(),
    desc: z.string().max(2000, 'Description too long').optional(),
    description: z.string().max(2000, 'Description too long').optional(),
    owner: z.string().max(50, 'Owner too long').optional(),
    priority: z.enum(['h', 'm', 'l']).optional(),
    // New fields
    labels: z.array(z.string()).optional(),
    assignees: z.array(z.string()).optional(),
    dueDate: z.string().optional(),
    points: z.number().optional(),
    checklist: z.array(z.object({
      id: z.string(),
      text: z.string(),
      done: z.boolean()
    })).optional(),
    status: z.string().optional(),
    // Nested set object for batch updates
    set: z.object({
      title: z.string().optional(),
      desc: z.string().optional(),
      description: z.string().optional(),
      owner: z.string().optional(),
      priority: z.enum(['h', 'm', 'l']).optional(),
      labels: z.array(z.string()).optional(),
      assignees: z.array(z.string()).optional(),
      dueDate: z.string().optional(),
      points: z.number().optional(),
      status: z.string().optional()
    }).optional()
  }),
  
  delete_card: z.object({
    columnId: z.string().optional(),
    cardId: z.string().optional(),
    id: z.string().optional()
  }),
  
  move_card: z.object({
    fromColumnId: z.string().optional(),
    toColumnId: z.string().min(1, 'Target column required'),
    cardId: z.string().min(1, 'Card ID required'),
    position: z.number().int().min(0).optional()
  }),
  
  comment: z.object({
    id: z.string().optional(),
    cardId: z.string().optional(),
    text: z.string().min(1, 'Comment text required'),
    author: z.string().optional()
  }),
  
  create_column: z.object({
    name: z.string().min(1, 'Column name required'),
    wipLimit: z.number().int().min(0).nullable().optional()
  }),
  
  rename_column: z.object({
    columnId: z.string().min(1, 'Column ID required'),
    newName: z.string().min(1, 'New name required')
  }),
  
  delete_column: z.object({
    columnId: z.string().min(1, 'Column ID required')
  }),
  
  set_wip_limit: z.object({
    columnId: z.string().min(1, 'Column ID required'),
    limit: z.number().int().min(0).nullable()
  }),
  
  merge_columns: z.object({
    sourceId: z.string().min(1, 'Source column required'),
    targetId: z.string().min(1, 'Target column required'),
    newName: z.string().optional()
  }),
  
  duplicate_card: z.object({
    columnId: z.string().min(1, 'Column ID required'),
    cardId: z.string().min(1, 'Card ID required')
  }),
  
  move_column: z.object({
    fromIndex: z.number().int().min(0),
    toIndex: z.number().int().min(0)
  })
};

// Main apply schema
export const applySchema = z.object({
  op: z.enum(Object.keys(boardOps)),
  args: z.record(z.any())
});
