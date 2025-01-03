import React, { FunctionComponent, ReactNode } from "react";

interface FooterProps {
  children: ReactNode;
}

export const Footer: FunctionComponent<FooterProps> = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
      }}
    >
      {React.Children.map(children, (child) => (
        <div style={{ paddingLeft: "5px" }}>{child}</div>
      ))}
    </div>
  );
};
