import type { BaseEntity } from "./common";

export type ProtocolAccreditation = {
  VILAS?: boolean;
  TDC?: boolean;
};

export interface Matrix extends BaseEntity {
  matrixId: string;
  parameterId: string;
  protocolId: string;
  sampleTypeId: string;

  protocolCode: string;
  protocolSource: string;
  protocolAccreditation?: ProtocolAccreditation;

  parameterName: string;
  sampleTypeName: string;

  feeBeforeTax: number;
  taxRate: number;
  feeAfterTax: number;

  LOD?: string;
  LOQ?: string;
  thresholdLimit?: string;
  turnaroundTime?: number;
  technicianGroupId?: string;
}

export interface Protocol extends BaseEntity {
  protocolId: string;
  protocolCode: string;
  protocolSource: string;
  protocolAccreditation?: ProtocolAccreditation;
}

export type ParameterDisplayStyle = {
  decimalPlaces?: number;
  unit?: string;
  [k: string]: unknown;
};

export interface Parameter extends BaseEntity {
  parameterId: string;
  parameterName: string;
  displayStyle?: ParameterDisplayStyle;
  technicianAlias?: string;
}

export interface SampleType extends BaseEntity {
  sampleTypeId: string;
  sampleTypeName: string;
  displayTypeStyle?: {
    eng?: string;
    default?: string;
  };
}

export interface ParameterGroup extends BaseEntity {
  groupId: string;
  groupName: string;
  sampleTypeId: string;
  sampleTypeName: string;

  matrixIds: string[];

  feeBeforeTaxAndDiscount: number;
  discountRate: number;
  feeBeforeTax: number;
  taxRate: number;
  feeAfterTax: number;
}
