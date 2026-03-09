import express from 'express';
import { getAccidentZonesNearLocation } from '../controllers/accidentZoneController';

const router = express.Router();

router.get('/', getAccidentZonesNearLocation);

export default router;

