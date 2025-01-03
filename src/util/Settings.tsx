import React, { useState, useEffect } from "react";
import { Gear as BaseGear, CloudArrowUpFill } from "@styled-icons/bootstrap";
import { styled } from "styled-components";
import {
  Dropdown,
  SimpleButtonStyled,
} from "@seasketch/geoprocessing/client-ui";
import project from "../../project/projectClient.js";
import { Datasource } from "@seasketch/geoprocessing/client-core";

const DropdownItemStyled = styled(SimpleButtonStyled)`
  font-size: 12px;
`;

const Gear = styled(BaseGear)`
  cursor: pointer;
  color: #999;

  &:hover {
    color: #666;
  }
`;

export const Settings: React.FunctionComponent = () => {
  const [lastModified, setLastModified] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => setLastModified(await fetchDatasourcesLastModified()))();
  }, []);

  const blob = new Blob([JSON.stringify({ lastModified })], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  return (
    <Dropdown
      titleElement={<Gear size={18} title="Settings" />}
      placement="top-end"
    >
      <a download="DataUpdateHistory.json" href={url}>
        <DropdownItemStyled>
          <span style={{ verticalAlign: "middle" }}>
            <CloudArrowUpFill size={16} /> View Data Update History
          </span>
        </DropdownItemStyled>
      </a>
    </Dropdown>
  );
};

/**
 * Fetches the last modified date of all internal datasources in the project
 * @returns Record object with {datasourceId: last modified date} for each datasource
 */
async function fetchDatasourcesLastModified() {
  const datasources: Datasource[] = project.datasources;
  const modDates: Record<string, string> = {};

  await Promise.all(
    datasources.map(async (ds: Datasource) => {
      try {
        const url = project.getDatasourceUrl(ds);
        const lastModified = await fetchLastModifiedHeader(url);
        modDates[ds.datasourceId] = lastModified ? lastModified : "NA";
      } catch (error) {
        console.log(`Error fetching ${ds.datasourceId} modification date`);
      }
    }),
  );

  return modDates;
}

/**
 * Fetches the Last-Modified date of an internal datasource in s3
 * @param url URL of the datasource in s3
 * @returns last modified date of that datasource
 */
async function fetchLastModifiedHeader(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok && response.headers.has("Last-Modified")
      ? response.headers.get("Last-Modified")
      : null;
  } catch {
    return null;
  }
}
