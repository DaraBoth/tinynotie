// components/ui/tanstackpage.tsx

import React from "react";

interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

interface TanStackPaginationProps {
  pageCount: number;
  pagination: PaginationState;
  handlePageChange: (newPageIndex: number) => void;
}

const TanStackPagination: React.FC<TanStackPaginationProps> = ({
  pageCount,
  pagination,
  handlePageChange,
}) => {
  const { pageIndex } = pagination;

  const previousPage = () => {
    if (pageIndex > 0) handlePageChange(pageIndex - 1);
  };

  const nextPage = () => {
    if (pageIndex < pageCount - 1) handlePageChange(pageIndex + 1);
  };

  return (
    <div className="flex justify-center items-center space-x-4 mt-4">
      <button
        onClick={previousPage}
        disabled={pageIndex === 0}
        className={`px-4 py-2 rounded-md ${
          pageIndex === 0
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        Previous
      </button>
      <span className="text-gray-700">
        Page {pageIndex + 1} of {pageCount}
      </span>
      <button
        onClick={nextPage}
        disabled={pageIndex >= pageCount - 1}
        className={`px-4 py-2 rounded-md ${
          pageIndex >= pageCount - 1
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        Next
      </button>
    </div>
  );
};

export default TanStackPagination;
