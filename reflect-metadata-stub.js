export const designMetadata = new Map();
export function decorateProperty(target: Object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  return descriptor;
}
export function designParamMetadata(target: Object, propertyKey: string, parameterIndex: number): void {
}
export function useDecorators(): ParameterDecorator {
  return function (target: any, propertyKey: string, parameterIndex: number): void {
  };
}