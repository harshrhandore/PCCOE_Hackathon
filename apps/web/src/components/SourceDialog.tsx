import * as Dialog from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import type { Dataset, Daily } from "../data/types";
import { RouteLink } from "./Shared";

export default function SourceDialog({
  data,
  field,
  onClose,
}: {
  data: Dataset;
  field?: Daily;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const meta = data.manifest.meta;
  return (
    <Dialog.Root
      open
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className="modal-content"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <Dialog.Title>{t("common.source")}</Dialog.Title>
          <Dialog.Description>{t("methods.resolution")}</Dialog.Description>
          <dl className="definition-grid">
            <dt>Publication</dt>
            <dd>{meta.issued_at}</dd>
            <dt>Fetched</dt>
            <dd>{meta.fetched_at}</dd>
            <dt>Model run</dt>
            <dd>{meta.model_run || t("freshness.noRun")}</dd>
            <dt>Boundary vintage</dt>
            <dd>2022 · {data.registry.definition}</dd>
            <dt>Method</dt>
            <dd>{meta.method_version}</dd>
            <dt>Quality flags</dt>
            <dd>
              {[...meta.quality_flags, ...(field?.quality_flags || [])].join(
                " · ",
              )}
            </dd>
            {field && (
              <>
                <dt>Upstream grid</dt>
                <dd>
                  {field.source_grid.latitude}, {field.source_grid.longitude}
                </dd>
              </>
            )}
          </dl>
          <RouteLink to="/methods">{t("nav.methods")}</RouteLink>
          <Dialog.Close className="button primary">
            {t("common.close")}
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
