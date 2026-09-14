import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

const mockInventory = [
  {
    id: 'inv-001',
    projectName: 'Lifestyle Palms',
    unitNumber: 'Tower B - 702',
    configuration: '3BHK Grand Edition',
    superAreaSqFt: 1650,
    carpetAreaSqFt: 1320,
    carpetEfficiency: '80%',
    facing: 'East / Central Green',
    price: 9650000,
    status: 'AVAILABLE',
    tags: ['Corner Unit', 'Park Facing', '2 Covered Parkings'],
  },
  {
    id: 'inv-002',
    projectName: 'Lifestyle Palms',
    unitNumber: 'Tower B - 904',
    configuration: '3BHK Grand Edition',
    superAreaSqFt: 1650,
    carpetAreaSqFt: 1320,
    carpetEfficiency: '80%',
    facing: 'East Facing',
    price: 9800000,
    status: 'AVAILABLE',
    tags: ['High Floor', 'Vastu Compliant'],
  },
  {
    id: 'inv-003',
    projectName: 'Lifestyle Grande',
    unitNumber: 'Tower 4 - 1401',
    configuration: '3BHK + Servant',
    superAreaSqFt: 2150,
    carpetAreaSqFt: 1720,
    carpetEfficiency: '80%',
    facing: 'North-East',
    price: 13500000,
    status: 'AVAILABLE',
    tags: ['Servant Room', 'Private Elevator Lobby'],
  }
];

// GET /api/v1/inventory
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockInventory });
});

// GET /api/v1/inventory/match
router.get('/match', (req: AuthenticatedRequest, res: Response) => {
  const { config, minPrice, maxPrice } = req.query;
  const filtered = mockInventory.filter(item => {
    if (config && !item.configuration.toLowerCase().includes(String(config).toLowerCase())) return false;
    if (minPrice && item.price < Number(minPrice)) return false;
    if (maxPrice && item.price > Number(maxPrice)) return false;
    return true;
  });
  res.json({ success: true, data: filtered.length ? filtered : mockInventory });
});

export default router;
