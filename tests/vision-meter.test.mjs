import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReading,suggestMeterReadings,reviewMeterUsage} from '../public/vision/meter-review.js';

test('only accepts strict, bounded readings', () => {
 assert.equal(parseReading('001234.500'),1234.5);
 assert.equal(parseReading('R123.45'),null);
 assert.equal(parseReading('1e10'),null);
 assert.equal(parseReading('-7'),null);
 assert.equal(parseReading('123.4567'),null);
});
test('extracts meter candidates with source evidence but ignores meter ID and account amounts', () => {
 const example='TOTAL R123.45\nMETER ID 987654\nPrevious reading: 1200\nCurrent meter reading: 1450.250';
 const result=suggestMeterReadings(example);
 assert.equal(result.previous,'1200');
 assert.equal(result.current,'1450.250');
 assert.equal(result.evidence.length,2);
});
test('does not silently calculate meter rollover or confusing amounts', () => {
 assert.equal(reviewMeterUsage({previous:'9000',current:'50'}).ok,false);
 assert.equal(reviewMeterUsage({previous:'1200',current:'1450.250',unit:'kWh',date:'2026-10-29'}).usage,250.25);
 assert.equal(reviewMeterUsage({previous:'1',current:'2',unit:'random'}).ok,false);
});
