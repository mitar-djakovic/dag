import { FormFieldsSource } from './form-fields-source';
import { GlobalDataSource } from './global-data-source';
import { DataSourceRegistry } from './registry';

export { FORM_FIELDS_SOURCE_ID, FormFieldsSource } from './form-fields-source';
export { GlobalDataSource } from './global-data-source';
export { DataSourceRegistry } from './registry';
export type {
  DataSourceField,
  DataSourceGroup,
  PrefillDataSource,
} from './types';

/**
 * Creates a fully-configured registry with all built-in data sources.
 * To add a custom source, call `registry.register(new MySource())`.
 */
export function createDefaultRegistry(): DataSourceRegistry {
  return new DataSourceRegistry()
    .register(new GlobalDataSource())
    .register(new FormFieldsSource());
}
