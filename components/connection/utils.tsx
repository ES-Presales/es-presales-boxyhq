import { errorToast } from '@components/Toaster';
import { isLocalhost } from '@lib/ui/utils';
import { FormEvent, SetStateAction, useMemo } from 'react';
import { EditViewOnlyFields, getCommonFields } from './fieldCatalog';

export const saveConnection = async ({
  formObj,
  isEditView,
  connectionIsSAML,
  connectionIsOIDC,
  setupLinkToken,
  callback,
}: {
  formObj: Record<string, string>;
  isEditView?: boolean;
  connectionIsSAML: boolean;
  connectionIsOIDC: boolean;
  setupLinkToken?: string;
  callback: (res: Response) => Promise<void>;
}) => {
  const { rawMetadata, redirectUrl, oidcDiscoveryUrl, oidcClientId, oidcClientSecret, metadataUrl, ...rest } =
    formObj;

  if (!isLocalhost() && metadataUrl && !metadataUrl.startsWith('https')) {
    errorToast('Metadata URL must start with https');
    return;
  }
  const encodedRawMetadata = btoa(rawMetadata || '');
  const redirectUrlList = redirectUrl?.split(/\r\n|\r|\n/);

  const res = await fetch(
    setupLinkToken ? `/api/setup/${setupLinkToken}/sso-connection` : '/api/admin/connections',
    {
      method: isEditView ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...rest,
        encodedRawMetadata: connectionIsSAML ? encodedRawMetadata : undefined,
        oidcDiscoveryUrl: connectionIsOIDC ? oidcDiscoveryUrl : undefined,
        oidcClientId: connectionIsOIDC ? oidcClientId : undefined,
        oidcClientSecret: connectionIsOIDC ? oidcClientSecret : undefined,
        redirectUrl: redirectUrl && redirectUrlList ? JSON.stringify(redirectUrlList) : undefined,
        metadataUrl: connectionIsSAML ? metadataUrl : undefined,
      }),
    }
  );
  callback(res);
};

export function fieldCatalogFilterByConnection(connection) {
  return ({ attributes }) =>
    attributes.connection && connection !== null ? attributes.connection === connection : true;
}

export function getHandleChange(
  setFormObj: (value: SetStateAction<Record<string, string>>) => void,
  opts: { key?: string } = {}
) {
  return (event: FormEvent) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormObj((cur) => ({ ...cur, [target.id]: target[opts.key || 'value'] }));
  };
}

type FieldCatalog = {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  attributes: {
    required?: boolean;
    maxLength?: number;
    editable?: boolean;
    isArray?: boolean;
    rows?: number;
    formatForDisplay?: (value) => string;
    isHidden?: (value) => boolean;
    showWarning?: (value) => boolean;
  };
};

export const useFieldCatalog = ({
  isEditView,
  isSettingsView,
}: {
  isEditView?: boolean;
  isSettingsView?: boolean;
}) => {
  const fieldCatalog = useMemo(() => {
    if (isEditView) {
      return [...getCommonFields({ isEditView: true, isSettingsView }), ...EditViewOnlyFields];
    }
    return [...getCommonFields({ isSettingsView })];
  }, [isEditView, isSettingsView]);
  return fieldCatalog;
};

export type AdminPortalSSODefaults = {
  tenant: string;
  product: string;
  redirectUrl: string;
  defaultRedirectUrl: string;
};

export function renderFieldList(args: {
  isEditView?: boolean;
  formObj: Record<string, string>;
  setFormObj: (value: SetStateAction<Record<string, string>>) => void;
}) {
  const FieldList = ({
    key,
    placeholder,
    label,
    type,
    attributes: {
      isHidden,
      isArray,
      rows,
      formatForDisplay,
      editable,
      maxLength,
      showWarning,
      required = true,
    },
  }: FieldCatalog) => {
    const disabled = editable === false;
    const value =
      disabled && typeof formatForDisplay === 'function'
        ? formatForDisplay(args.formObj[key])
        : args.formObj[key];
    return (
      <div className='mb-6 ' key={key}>
        {type !== 'checkbox' && (
          <label
            htmlFor={key}
            className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300 ${
              isHidden ? (isHidden(args.formObj[key]) == true ? 'hidden' : '') : ''
            }`}>
            {label}
          </label>
        )}
        {type === 'pre' ? (
          <pre
            className={`block w-full cursor-not-allowed overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-2 
            text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 
            dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 
            dark:focus:ring-blue-500 ${
              isHidden ? (isHidden(args.formObj[key]) == true ? 'hidden' : '') : ''
            } ${showWarning ? (showWarning(args.formObj[key]) ? 'border-2 border-rose-500' : '') : ''}`}>
            {value}
          </pre>
        ) : type === 'textarea' ? (
          <textarea
            id={key}
            placeholder={placeholder}
            value={value}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            onChange={getHandleChange(args.setFormObj)}
            className={`textarea-bordered textarea h-24 w-full ${isArray ? 'whitespace-pre' : ''} ${
              isHidden ? (isHidden(args.formObj[key]) == true ? 'hidden' : '') : ''
            }`}
            rows={rows}
          />
        ) : type === 'checkbox' ? (
          <>
            <label
              htmlFor={key}
              className={`inline-block align-middle text-sm font-medium text-gray-900 dark:text-gray-300 ${
                isHidden ? (isHidden(args.formObj[key]) == true ? 'hidden' : '') : ''
              }`}>
              {label}
            </label>
            <input
              id={key}
              type={type}
              checked={!!value}
              required={required}
              disabled={disabled}
              maxLength={maxLength}
              onChange={getHandleChange(args.setFormObj, { key: 'checked' })}
              className='checkbox-primary checkbox ml-5 align-middle'
            />
          </>
        ) : (
          <input
            id={key}
            type={type}
            placeholder={placeholder}
            value={type === 'text' ? value || '' : value}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            onChange={getHandleChange(args.setFormObj)}
            className={`input-bordered input w-full ${
              isHidden ? (isHidden(args.formObj[key]) == true ? 'hidden' : '') : ''
            }`}
          />
        )}
      </div>
    );
  };
  return FieldList;
}
