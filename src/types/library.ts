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

export type ProtocolParameter = {
    parameterId: string;
    parameterName: string;
};

export type ProtocolSampleType = {
    sampleTypeId: string;
    sampleTypeName: string;
};

export type ProtocolChemical = {
    chemicalId: string;
    chemicalName: string;
    chemicalCAS?: string;
    chemicalFormula?: string;
    amountUsed?: string;
    measurementUnit?: string;
};

export interface Protocol extends BaseEntity {
    protocolId: string;
    protocolCode: string;
    protocolSource: string;
    protocolAccreditation?: ProtocolAccreditation;
    protocolTitle?: string;
    protocolDescription?: string;
    protocolDocumentIds?: string[];
    parameters?: ProtocolParameter[];
    sampleTypes?: ProtocolSampleType[];
    chemicals?: ProtocolChemical[];
}

export type ParameterDisplayStyle = {
    eng?: string;
    default?: string;
    [k: string]: unknown;
};

export interface Parameter extends BaseEntity {
    parameterId: string;
    parameterName: string;
    displayStyle?: ParameterDisplayStyle;
    technicianAlias?: string | null;
    technicianGroupId?: string | null;
    parameterSearchKeys?: string[] | null;
    parameterStatus?: string | null;
    parameterNote?: string | null;
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
