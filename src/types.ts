import { SourceLocation } from '@babel/types';

export interface MessageDescriptor {
  id: string;
  defaultMessage: string;
  filename?: string;
  loc?: SourceLocation;
  translatedMessage?: Record<string, string>;
  [locale: string]: any;
}

export interface PluginOptions {
  functionNames?: string[];
  componentNames?: string[];
  shortcut?:
    | boolean
    | {
        functionName: string;
      };
  fileLoc?: boolean;
  removeDefaultMessage?: boolean;
}

export interface ScanOptions extends PluginOptions {
  source?: string;
  dist?: string;
  convertor?: (store: Map<string, MessageDescriptor>) => any;
}

export interface ICreateUmiIntlPluginOptions extends Omit<ScanOptions, 'source'> {
  distributeDir?: string;
}

export interface TranslatedData {
  id: string;
  [locale: string]: string;
}
