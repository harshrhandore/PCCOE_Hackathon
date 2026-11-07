import{describe,it,expect}from'vitest';import{validatedParams,localParts,csvCell,number}from'../../src/lib/state';
describe('public state and safe exports',()=>{
 it('validates URL state rather than accepting invented wards or hours',()=>{expect(validatedParams(new URLSearchParams('t=99&ward=not-a-ward&layer=bad&mode=actual'),['2026-11-07'],['pune-2022-1'])).toMatchObject({hour:14,ward:null,layer:'risk',mode:'live',date:'2026-11-07'});});
 it('retains UTC instants in the containing IST bins',()=>{expect(localParts('2025-05-01T15:00:00Z')).toEqual({date:'2025-05-01',hour:20});expect(localParts('2025-05-01T19:00:00Z')).toEqual({date:'2025-05-02',hour:0});});
 it('escapes CSV formula text and quotes',()=>{expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"');expect(csvCell('a"b')).toBe('"a""b"');expect(csvCell(null)).toBe('""');});
 it('distinguishes missing values from zero',()=>{expect(number(null)).toBe('—');expect(number(0)).toBe('0.0');});
});
