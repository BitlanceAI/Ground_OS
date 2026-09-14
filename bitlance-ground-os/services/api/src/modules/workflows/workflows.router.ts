import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

const mockWorkflows = [
  {
    id: 'wf-001',
    name: 'Post-Meeting High-Intent Conversion Flow',
    description: 'Triggered when Meeting Report has Intent >= 80. Generates creative sheet, WhatsApp follow-up, and schedules Voice AI confirmation.',
    active: true,
    triggersCount: 42,
    conversionRate: 68.4,
    nodes: [
      { id: 'node-1', type: 'TRIGGER', label: 'AI_REPORT_READY (Intent >= 80)' },
      { id: 'node-2', type: 'AI', label: 'Generate Personalized Comparison Card' },
      { id: 'node-3', type: 'MESSAGE', label: 'Send WhatsApp Creative + Floorplan' },
      { id: 'node-4', type: 'DELAY', label: 'Wait 24 Hours' },
      { id: 'node-5', type: 'CONDITION', label: 'Site Visit Confirmed?' },
      { id: 'node-6', type: 'VOICE', label: 'Trigger Voice AI Confirmation Call' },
      { id: 'node-7', type: 'CRM_UPDATE', label: 'Update Pipeline Stage: NEGOTIATION' },
    ]
  },
  {
    id: 'wf-002',
    name: 'Dormant Lead Re-engagement (48h Inactive)',
    description: 'Auto-activates Voice AI follow-up when customer has had no interaction for 48 hours.',
    active: true,
    triggersCount: 128,
    conversionRate: 34.2,
    nodes: [
      { id: 'node-1', type: 'TRIGGER', label: 'CUSTOMER_INACTIVE > 48h' },
      { id: 'node-2', type: 'CONDITION', label: 'Lead Score > 60?' },
      { id: 'node-3', type: 'VOICE', label: 'Voice AI Courtesy Reconnect Call' },
      { id: 'node-4', type: 'AI', label: 'Analyze Call Transcript & Score' },
    ]
  }
];

// GET /api/v1/workflows
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockWorkflows });
});

// GET /api/v1/workflows/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const wf = mockWorkflows.find(w => w.id === req.params.id) || mockWorkflows[0];
  res.json({ success: true, data: wf });
});

// POST /api/v1/workflows
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const newWf = {
    id: `wf-${Date.now()}`,
    name: req.body.name || 'Untitled Automation',
    description: req.body.description || '',
    active: true,
    triggersCount: 0,
    conversionRate: 0,
    nodes: req.body.nodes || [],
  };
  mockWorkflows.push(newWf);
  res.status(201).json({ success: true, data: newWf });
});

export default router;
