import { Resource } from '@medplum/fhirtypes';
import { ElementsContextType, buildElementsContext } from '../elements-context';
import { InternalTypeSchema, getDataType } from '../typeschema/types';
import { getValueAtKey } from '../default-values';

type FhirProxyOptions = {
  path?: string;
  profileUrl?: string;
};

// export const FHIR_PROXY_ORIGINAL = Symbol('proxy_target_identity');
export function makeFhirProxy<T extends Resource>(resource: T, options?: FhirProxyOptions): T {
  const path = options?.path ?? resource.resourceType;
  const typeSchema = getDataType(resource.resourceType, options?.profileUrl);
  if (!typeSchema) {
    throw new Error('Could not find type schema for ' + resource.resourceType);
  }
  const parentElementsContext: ElementsContextType | undefined = undefined;
  return new Proxy(resource, new FhirProxyHandler<T>(path, typeSchema, parentElementsContext, options));
}

class FhirProxyHandler<T extends Resource> implements ProxyHandler<T> {
  context: ElementsContextType;
  options: FhirProxyOptions;

  constructor(
    path: string,
    typeSchema: InternalTypeSchema,
    parentElementsContext?: ElementsContextType,
    options?: FhirProxyOptions
  ) {
    this.context = buildElementsContext({
      path,
      parentContext: parentElementsContext,
      elements: typeSchema.elements,
      profileUrl: typeSchema.url,
    });
    this.options = options ?? {};
  }

  get(target: T, prop: string | symbol, receiver: any): any {
    if (typeof prop === 'symbol') {
      return Reflect.get(target, prop, receiver);
    }

    console.log('GET', prop);

    if (prop.includes('.')) {
      return getValueAtKey(target, prop, this.context.elements);
    } else {
      return Reflect.get(target, prop, receiver);
    }
  }

  set(target: any, p: string, value: unknown, receiver: any): boolean {
    console.log('SET', p, value, receiver);
    return Reflect.set(target, p, value, receiver);
  }
}

export class FhirProxy<T extends Resource> extends Proxy<T> {
  context: ElementsContextType | undefined;
  options?: FhirProxyOptions;

  constructor(target: T, handler: ProxyHandler<T>, options?: FhirProxyOptions) {
    super(target, handler);
    this.options = options;
    this.context = undefined;
  }
}

// function getFhirProxyHandler<T extends Resource>(
//   path: string,
//   typeSchema: InternalTypeSchema,
//   parentElementsContext?: ElementsContextType,
//   options?: FhirProxyOptions
// ): ProxyHandler<T> {
//   const elementsContext = buildElementsContext({
//     path,
//     parentContext: parentElementsContext,
//     elements: typeSchema.elements,
//     profileUrl: typeSchema.url,
//   });
//
//   return {
//     context: elementsContext,
//     options,
//     get(target: T, p: any, receiver) {
//       // console.log('GET', p, receiver, options);
//       // if (p === FHIR_PROXY_ORIGINAL) {
//       //   return target;
//       // }
//       if (p.includes('.')) {
//         console.log('target', target);
//         console.log('receiver', receiver);
//         return getValueAtKey(target, p, receiver.context.elements);
//       } else {
//         return Reflect.get(target, p, receiver);
//       }
//     },
//     set(target: any, p: string, value: unknown, receiver: any) {
//       console.log('SET', p, value, receiver);
//       return Reflect.set(target, p, value, receiver);
//     },
//   } as ProxyHandler<T>;
// }

// class FhirProxyClass<T extends Resource> extends Proxy<T> {
//   // constructor(target: T, handler: ProxyHandler) {
//   //   super(target, handler);
//   // }
//   context: ElementsContextType;
//
//   constructor<T>(target: T, handler: ProxyHandler<T>, options?: FhirProxyOptions) {
//     this.context = buildElementsContext({
//       path,
//       parentContext: parentElementsContext,
//       elements: typeSchema.elements,
//       profileUrl: typeSchema.url,
//     });
//     super(target, handler);
//   }
//
//   get(target: T, p: any, receiver: ProxyHandler<T>): any {
//     // console.log('GET', p, receiver, options);
//     // if (p === FHIR_PROXY_ORIGINAL) {
//     //   return target;
//     // }
//     if (p.includes('.')) {
//       console.log('target', target);
//       console.log('receiver', receiver);
//       return getValueAtKey(target, p, this.context.elements);
//     } else {
//       return Reflect.get(target, p, receiver);
//     }
//   }
//   set(target: any, p: string, value: unknown, receiver: any) {
//     console.log('SET', p, value, receiver);
//     return Reflect.set(target, p, value, receiver);
//   }
// }
