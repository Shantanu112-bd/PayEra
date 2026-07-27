import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  FiatRampProvider,
  RampProviderId,
  RAMP_PROVIDERS,
} from './fiat-ramp-provider.interface';

/**
 * Resolves ramp providers by id. This is the ONLY place the application looks
 * up a provider — services depend on the registry, never on a concrete class.
 * Adding a provider = add its class to the RampsModule providers array (it is
 * collected into RAMP_PROVIDERS) and add its id to the RampProvider enum.
 */
@Injectable()
export class RampProviderRegistry {
  private readonly byId = new Map<RampProviderId, FiatRampProvider>();

  constructor(@Inject(RAMP_PROVIDERS) providers: FiatRampProvider[]) {
    for (const provider of providers) {
      if (this.byId.has(provider.id)) {
        throw new Error(`Duplicate ramp provider registered: ${provider.id}`);
      }
      this.byId.set(provider.id, provider);
    }
  }

  /** All registered provider ids. */
  list(): RampProviderId[] {
    return [...this.byId.keys()];
  }

  has(id: string): id is RampProviderId {
    return this.byId.has(id as RampProviderId);
  }

  /** Resolve a provider or throw a 404-style error for an unknown id. */
  get(id: string): FiatRampProvider {
    const provider = this.byId.get(id as RampProviderId);
    if (!provider) {
      throw new NotFoundException(
        `Unknown ramp provider "${id}". Registered: ${this.list().join(', ') || '(none)'}`,
      );
    }
    return provider;
  }
}
