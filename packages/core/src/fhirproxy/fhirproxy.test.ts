import { Bundle, Patient } from '@medplum/fhirtypes';
import { makeFhirProxy } from './fhirproxy';
import { indexStructureDefinitionBundle } from '../typeschema/types';
import { readJson } from '@medplum/definitions';

describe('FHIRProxy', () => {
  beforeAll(() => {
    // indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    // indexStructureDefinitionBundle(readJson('fhir/r4/profiles-medplum.json') as Bundle);
  });
  test('Basic read and write keys', () => {
    const fp = makeFhirProxy<Patient>({ resourceType: 'Patient' });
    expect(fp.resourceType).toBe('Patient');
    expect(fp.active).toBeUndefined();
    fp.active = true;
    expect(fp).toEqual({ resourceType: 'Patient', active: true });
    expect({ ...fp }).toEqual({ resourceType: 'Patient', active: true });
    expect(fp.resourceType).toBe('Patient');
    expect(fp.active).toBe(true);
  });

  test.only('Read nested keys', () => {
    const fp = makeFhirProxy<Patient>({
      resourceType: 'Patient',
      name: [{ family: 'Long' }, { given: ['Matt'] }],
    });
    // expect(fp['name.given']).toEqual([undefined, ['Matt']]);
    expect(fp.name?.map((n) => n.given)).toEqual([undefined, ['Matt']]);
  });
});
