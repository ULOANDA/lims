// SampleTypeCreateModal.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateSampleType } from "@/api/library";

type Props = {
    onClose: () => void;
    initialData?: {
        sampleTypeName: string;
        displayDefault: string;
        displayEng: string;
    };
};

type FormState = {
    sampleTypeName: string;
    displayDefault: string;
    displayEng: string;
};

function toOptionalTrimmed(v: string): string | undefined {
    const x = v.trim();
    return x.length > 0 ? x : undefined;
}

export function SampleTypeCreateModal(props: Props) {
    const { t } = useTranslation();
    const { onClose } = props;

    const create = useCreateSampleType();

    const [form, setForm] = useState<FormState>({
        sampleTypeName: props.initialData?.sampleTypeName ?? "",
        displayDefault: props.initialData?.displayDefault ?? "",
        displayEng: props.initialData?.displayEng ?? "",
    });

    const submit = async () => {
        const name = form.sampleTypeName.trim();
        if (!name) return;

        const displayDefault = toOptionalTrimmed(form.displayDefault);
        const displayEng = toOptionalTrimmed(form.displayEng);

        await create.mutateAsync({
            body: {
                sampleTypeName: name,
                displayTypeStyle: displayDefault || displayEng ? { default: displayDefault, eng: displayEng } : undefined,
            },
        });

        onClose();
    };

    const canSubmit = form.sampleTypeName.trim().length > 0 && !create.isPending;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg border border-border w-full max-w-lg shadow-xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="text-base font-semibold text-foreground">{t("library.sampleTypes.create.title")}</div>
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        {t("common.close")}
                    </Button>
                </div>

                <div className="p-5 space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">{t("library.sampleTypes.create.sampleTypeName")}</div>
                        <Input
                            value={form.sampleTypeName}
                            onChange={(e) => setForm((s) => ({ ...s, sampleTypeName: e.target.value }))}
                            placeholder={t("library.sampleTypes.create.sampleTypeNamePlaceholder")}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">{t("library.sampleTypes.create.displayDefault")}</div>
                        <Input
                            value={form.displayDefault}
                            onChange={(e) => setForm((s) => ({ ...s, displayDefault: e.target.value }))}
                            placeholder={t("library.sampleTypes.create.displayDefaultPlaceholder")}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">{t("library.sampleTypes.create.displayEng")}</div>
                        <Input value={form.displayEng} onChange={(e) => setForm((s) => ({ ...s, displayEng: e.target.value }))} placeholder={t("library.sampleTypes.create.displayEngPlaceholder")} />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={onClose} type="button">
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={() => void submit()} disabled={!canSubmit} type="button">
                            {create.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                    </div>

                    {create.isError ? <div className="text-sm text-destructive">{t("library.sampleTypes.create.error")}</div> : null}
                </div>
            </div>
        </div>
    );
}
