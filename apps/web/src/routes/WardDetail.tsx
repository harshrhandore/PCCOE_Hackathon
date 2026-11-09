import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Dataset } from "../data/types";
import { PageHeading, Empty, RouteLink } from "../components/Shared";
import WardContext from "../components/WardContext";
export default function WardDetail({
  data,
  date,
}: {
  data: Dataset;
  date: string;
  hour: number;
}) {
  const { id } = useParams();
  const { t } = useTranslation();
  const ward = data.registry.wards.find((w) => w.id === id);
  if (!ward)
    return (
      <Empty title={t("state.notFound")}>
        <RouteLink to="/">{t("common.returnList")}</RouteLink>
      </Empty>
    );
  return (
    <div className="ward-detail-page">
      <RouteLink to="/">← {t("common.returnList")}</RouteLink>
      <PageHeading
        kicker={`PRABHAG ${ward.source_ward_id} · ${date} IST · 2022 BOUNDARIES`}
        title={ward.name_en}
      />
      <WardContext
        data={data}
        ward={ward}
        row={data.daily.find((d) => d.ward_id === id && d.date === date)}
        full
      />
    </div>
  );
}
