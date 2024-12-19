"use client";

import React, { useEffect, useState } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { usePathname } from "next/navigation";

const BreadCrumb = () => {
  const param = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    // Split the pathname by '/' and filter out any empty strings or encoded-like paths
    const paths = param
      .split("/")
      .filter((segment) => segment !== "" && !/^[a-zA-Z0-9_-]{20,}$/.test(segment)); // Exclude long encoded-like strings
    setBreadcrumbs(paths);
  }, [param]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((segment, index) => {
          // Create the href dynamically by joining segments
          const href = "/" + breadcrumbs.slice(0, index + 1).join("/");
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="capitalize">{segment}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="capitalize" href={href}>{segment}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadCrumb;
