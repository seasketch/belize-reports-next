import React from "react";
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
  const lastUpdated: Record<string, string> = Object.fromEntries(
    project.datasources.map((ds: Datasource) => [
      ds.datasourceId,
      "lastUpdated" in ds ? ds.lastUpdated : "N/A",
    ]),
  );

  const blob = new Blob([JSON.stringify({ lastUpdated })], {
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
            <CloudArrowUpFill size={16} /> Data Update History
          </span>
        </DropdownItemStyled>
      </a>
    </Dropdown>
  );
};
