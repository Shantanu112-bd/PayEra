export class ExponentialBackoff {}
export class ConsecutiveBreaker {
  constructor(public max: number) {}
}
export const handleAll = {};
export const Policy = {};
export const retry = () => ({});
export const circuitBreaker = () => ({
  onBreak: jest.fn(),
  onReset: jest.fn()
});
export const wrap = () => ({
  execute: async (fn: any) => fn()
});
