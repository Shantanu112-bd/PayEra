import { Injectable, Logger } from '@nestjs/common'
import { ConsecutiveBreaker, ExponentialBackoff, handleAll, retry, circuitBreaker, wrap } from 'cockatiel'

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name)

  private readonly policies = new Map<string, ReturnType<typeof wrap>>()

  getPolicy(name: string) {
    if (this.policies.has(name)) {
      return this.policies.get(name)!
    }

    const retryPolicy = retry(handleAll, {
      maxAttempts: 3,
      backoff: new ExponentialBackoff(),
    })

    const breakerPolicy = circuitBreaker(handleAll, {
      halfOpenAfter: 10_000,
      breaker: new ConsecutiveBreaker(5),
    })

    breakerPolicy.onBreak(() => {
      this.logger.warn(`Circuit breaker OPEN for: ${name}`)
    })

    breakerPolicy.onReset(() => {
      this.logger.log(`Circuit breaker CLOSED for: ${name}`)
    })

    const policy = wrap(retryPolicy, breakerPolicy)
    this.policies.set(name, policy)
    return policy
  }
}
