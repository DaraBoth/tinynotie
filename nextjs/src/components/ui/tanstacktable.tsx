import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import TanStackPagination from "@/components/ui/tanstackpage";

interface TanStackTableProps<TData> {
  data: TData[];
  columnMapping?: Record<string, string | null>;
  itemsPerPage?: number;
}

const TanStackTable = <TData,>({
  data,
  columnMapping = {},
  itemsPerPage = 5,
}: TanStackTableProps<TData>) => {
  const [isMobile, setIsMobile] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: itemsPerPage,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const columns = useMemo<ColumnDef<TData, any>[]>(() => {
    const defaultMapping = {
      id: "ID",
      name: "Name",
      paid: "Paid",
      remain: "Remain",
      unpaid: "Unpaid",
    };
  
    columnMapping = Object.assign(defaultMapping, columnMapping);
  
    return Object.keys(data[0] || {}).map((key) => ({
      header: columnMapping[key] !== null ? columnMapping[key] : key,
      accessorKey: key,
      enableHiding: columnMapping[key] === null,
    })) as ColumnDef<TData, any>[];
  }, [data, columnMapping]);

  const tablePageData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return data.slice(start, end);
  }, [data, pagination]);

  const table = useReactTable({
    data: tablePageData,
    columns: columns.filter((col) => col.header !== null),
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    manualPagination: true,
    pageCount: Math.ceil(data.length / pagination.pageSize),
  });

  const handlePageChange = (newPageIndex: number) => {
    setPagination((prev) => ({ ...prev, pageIndex: newPageIndex }));
  };

  if (isMobile) {
    return (
      <div>
        <div className="space-y-4 overflow-y-auto max-h-96">
          {tablePageData.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="border rounded-lg p-4 bg-white shadow-md hover:bg-gray-100 transition-colors"
            >
              {Object.entries(row as any).map(
                ([key, value]) =>
                  columnMapping[key] !== null && (
                    <div
                      key={key}
                      className="flex justify-between py-1 border-b last:border-none"
                    >
                      <span className="font-semibold text-gray-800">
                        {columnMapping[key] ?? key}
                      </span>
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  )
              )}
            </div>
          ))}
        </div>
        <TanStackPagination
          pageCount={Math.ceil(data.length / pagination.pageSize)}
          pagination={pagination}
          handlePageChange={handlePageChange}
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="relative max-h-[500px] overflow-y-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead className="bg-blue-100 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-800"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t hover:bg-gray-50 transition-colors duration-200"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TanStackPagination
        pageCount={Math.ceil(data.length / pagination.pageSize)}
        pagination={pagination}
        handlePageChange={handlePageChange}
      />
    </div>
  );
};

export default TanStackTable;
