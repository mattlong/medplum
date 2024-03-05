import { showNotification } from '@mantine/notifications';
import { deepClone, normalizeErrorString, normalizeOperationOutcome } from '@medplum/core';
import { OperationOutcome, Resource, ResourceType } from '@medplum/fhirtypes';
import { Document, ResourceForm, useMedplum } from '@medplum/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cleanResource } from './utils';

const DEBUG_OUTCOME: OperationOutcome = {
  resourceType: 'OperationOutcome',
  issue: [
    {
      severity: 'error',
      code: 'structure',
      details: {
        text: 'Missing required property',
      },
      expression: ['Patient.identifier[1].system'],
    },
  ],
  extension: [
    {
      url: 'https://medplum.com/fhir/StructureDefinition/tracing',
      extension: [
        {
          url: 'requestId',
          valueId: 'c59fc26f-d0c4-4d30-a600-add51f8ceeba',
        },
        {
          url: 'traceId',
          valueId: 'ef076766-633c-446d-a793-48ac2b587dfc',
        },
      ],
    },
  ],
};
export function EditPage(): JSX.Element | null {
  const medplum = useMedplum();
  const { resourceType, id } = useParams() as { resourceType: ResourceType; id: string };
  const [value, setValue] = useState<Resource | undefined>();
  const navigate = useNavigate();
  const [outcome, setOutcome] = useState<OperationOutcome | undefined>(DEBUG_OUTCOME);

  useEffect(() => {
    medplum
      .readResource(resourceType, id)
      .then((resource) => setValue(deepClone(resource)))
      .catch((err) => {
        setOutcome(normalizeOperationOutcome(err));
        showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
      });
  }, [medplum, resourceType, id]);

  const handleSubmit = useCallback(
    (newResource: Resource): void => {
      setOutcome(undefined);
      medplum
        .updateResource(cleanResource(newResource))
        .then(() => {
          navigate(`/${resourceType}/${id}/details`);
          showNotification({ color: 'green', message: 'Success' });
        })
        .catch((err) => {
          setOutcome(normalizeOperationOutcome(err));
          showNotification({ color: 'red', message: normalizeErrorString(err), autoClose: false });
        });
    },
    [medplum, resourceType, id, navigate]
  );

  const handleDelete = useCallback(() => navigate(`/${resourceType}/${id}/delete`), [navigate, resourceType, id]);

  if (!value) {
    return null;
  }

  return (
    <Document>
      <ResourceForm defaultValue={value} onSubmit={handleSubmit} onDelete={handleDelete} outcome={outcome} />
    </Document>
  );
}
