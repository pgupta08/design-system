import * as React from 'react';
import { Header, ExternalHeaderProps, updateSearchTermFunction, HeaderProps } from '../grid/Header';
import { Grid, Pagination } from '@/index';
import {
  Data,
  onSelectFunction,
  onSelectAllFunction,
  GridProps,
  fetchDataFunction,
  RowData,
  updateSchemaFunction,
  updateSortingListFunction,
  updateFilterListFunction
} from '../grid';
import { updateBatchData, filterData, sortData, paginateData, getSelectAll, getTotalPages } from '../grid/utility';
import { BaseProps, extractBaseProps } from '@/utils/types';
import { debounce } from 'throttle-debounce';
import { PaginationProps } from '@/components/molecules/pagination';

interface SyncProps {
  /**
   * <pre className="DocPage-codeBlock">
   *    Data: RowData[]
   *
   *    RowData: Record<string, any> & {
   *      _selected?: boolean
   *    }
   *
   *    `_selected`  Denotes row selection
   * </pre>
   */
  data: GridProps['data'];
  /* tslint:disable */
  /**
   * <pre className="DocPage-codeBlock">
   *    Schema: ColumnSchema[]
   *
   *    ColumnSchema: {
   *        name: string;
   *        displayName: string;
   *        width?: React.ReactText;
   *        minWidth?: React.ReactText;
   *        maxWidth?: React.ReactText;
   *        resizable?: boolean;
   *        sorting?: boolean;
   *        comparator?: (a: RowData, b: RowData) => -1 | 0 | 1;
   *        separator?: boolean;
   *        pinned?: 'left' | 'right';
   *        hidden?: boolean;
   *        filters?: DropdownProps['options'];
   *        onFilterChange?: (data: RowData, filters: Filter) => boolean;
   *        translate?: (data: RowData) => RowData,
   *        cellType?: CellType;
   *        cellRenderer?: React.FunctionComponent\<GridCellProps\>;
   *        align?: Alignment;
   *    }
   *
   *    GridCellProps: {
   *        size: GridSize;
   *        rowIndex: number;
   *        colIndex: number;
   *        data: RowData;
   *        schema: ColumnSchema;
   *        loading: boolean;
   *    }
   *
   * | CellType | CellData | Default Width |
   * | --- | --- | --- |
   * | DEFAULT | string \| { title: string } | { width: 200 } |
   * | WITH\_META\_LIST | { title: string, metaList: string[] } | { width: 200 } |
   * | AVATAR | { firstName?: string, lastName?: string, title?: string } | { width: 50, minWidth: 50 } |
   * | AVATAR\_WITH\_TEXT | { firstName?: string, lastName?: string, title: string } | { width: 250 } |
   * | AVATAR\_WITH\_META\_LIST | { firstName?: string, lastName?: string, title: string, metaList: string[] } | { width: 250 } |
   * | ICON | { icon: string } | { width: 50, minWidth: 50 } |
   * | STATUS_HINT | { title: string, statusAppearance: string } | { width: 100 } |
   * </pre>
   *
   * | Name | Description | Default |
   * | --- | --- | --- |
   * | name | key of the value in `RowData` | |
   * | displayName | Column Head Label | |
   * | width | width of the column(in px) | |
   * | minWidth | min-width of the column(in px) | 100 |
   * | maxWidth | max-width of the column(in px) | 800 |
   * | resizable | Denotes if column is resizable | |
   * | sorting | Enables sorting in column | true |
   * | comparator | Sorting Function to be passed(in case of async) | |
   * | separator | Shows Left separator | |
   * | tooltip | Shows tooltip on hover | |
   * | pinned | Pin column | |
   * | hidden | Denotes if column is hidden | |
   * | filters | Filter options for the column | |
   * | onFilterChange | Callback to be called on Filter Change | |
   * | translate | Translate Cell Data | |
   * | cellType | Cell Type | 'DEFAULT' |
   * | cellRenderer | Custom Cell Renderer | |
   * | align | Align cell content<br>**Align applicable only for following cellTypes:<br>DEFAULT, AVATAR, ICON, STATUS_HINT** | "left" |
   */
  /* tslint:enable */
  schema: GridProps['schema'];
  /**
   * Set for loading state of Table(in case of sync)
   * @default false
   */
  loading: GridProps['loading'];
  /**
   * Set for error state of Table(in case of sync)
   * @default false
   */
  error: GridProps['error'];
  /**
   * Callback to be called on searchTerm change(in case of sync)
   */
  onSearch?: (data: Data, searchTerm: string) => Data;
}

interface AsyncProps {
  /**
   * Callback to be called in case of async `Table`
   *
   * <pre className="DocPage-codeBlock">
   * fetchDataFunction: (options: FetchDataOptions) => Promise<{
   *      count: number,
   *      data: Data,
   *      schema: Schema
   * }>;
   *
   * FetchDataOptions: {
   *      page?: number;
   *      pageSize?: number;
   *      filterList?: TableProps['sortingList'];
   *      sortingList?: TableProps['filterList'];
   *      searchTerm?: string;
   *  }
   * </pre>
   */
  fetchData?: fetchDataFunction;
}

interface SharedTableProps extends BaseProps {
  /**
   * Controls Table Head display
   */
  showHead: GridProps['showHead'];
  /**
   * Type of Table
   *
   * **Requires `onRowClick` for 'resource' Table**
   * @default "data"
   */
  type: GridProps['type'];
  /**
   * Table cell size
   * @default "standard"
   */
  size: GridProps['size'];
  /**
   * Allow Column reordering
   * @default true
   */
  draggable: GridProps['draggable'];
  /**
   * Allow nested rows
   */
  nestedRows?: GridProps['nestedRows'];
  /**
   * Renderer to be used for nested rows
   * <pre className="DocPage-codeBlock">
   * NestedRowProps: {
   *    rowIndex: number;
   *    data: RowData;
   *    schema: GridProps['schema'];
   *    loading: boolean;
   * }
   * </pre>
   */
  nestedRowRenderer?: GridProps['nestedRowRenderer'];
  /**
   * Set to use `Header`
   */
  withHeader?: boolean;
  /**
   * Options to be passed if using `withHeader: true`
   *
   * <pre className="DocPage-codeBlock">
   * ExternalHeaderProps: {
   *    children?: React.ReactNode;
   *    withSearch?: boolean;
   *    searchPlaceholder?: string;
   *    dynamicColumn?: boolean;
   *    allowSelectAll?: boolean;
   * }
   * </pre>
   *
   * | Name | Description | Default |
   * | --- | --- | --- |
   * | children | Header actions to be rendered | |
   * | withSearch | Set to use Search Input | |
   * | searchPlaceholder | Placeholder of Search Input | "Search" |
   * | dynamicColumn | Set to use Column controlling dropdown | true |
   * | allowSelectAll | Set to show Select All button | |
   *
   */
  headerOptions?: ExternalHeaderProps;
  /**
   * Set for Row checkboxes
   */
  withCheckbox?: GridProps['withCheckbox'];
  /**
   * Set for visibility of Menu on Table Head Cell
   */
  showMenu?: GridProps['showMenu'];
  /**
   * Set for `Pagination` component in `Table`(**Not applied if pageSize >= totalRecords**)
   * @default true
   */
  withPagination: GridProps['withPagination'];
  /**
   * Initial page passed to `Table`
   * @default 1
   */
  page: GridProps['page'];
  /**
   * `Pagination` component type
   * @default "jump"
   */
  paginationType: PaginationProps['type'];
  /**
   * Number of rows to be rendered on a page
   *
   * **Also used to control number of rows to be rendered while loading: true**
   * @default 15
   */
  pageSize: GridProps['pageSize'];
  /**
   * Schema to be used for loading state **only when `schema: undefined`**
   */
  loaderSchema: GridProps['loaderSchema'];
  /**
   * Set to allow multiple column sorting
   * @default true
   */
  multipleSorting: boolean;
  /**
   * Initial sortingList passed to `Table`
   * <pre className="DocPage-codeBlock">
   * SortType: 'asc' | 'desc'
   * </pre>
   * @default []
   */
  sortingList: GridProps['sortingList'];
  /**
   * Initial filterList passed to `Table`
   * <pre className="DocPage-codeBlock">
   * Filter: Array of selected values passed in dropdown
   * `any[]`
   * </pre>
   * @default {}
   */
  filterList: GridProps['filterList'];
  /**
   * Template to be rendered when **error: true**
   */
  errorTemplate?: GridProps['errorTemplate'];
  /**
   * Callback to be called when a row is clicked in case of Table type: "resource"
   *
   * `onRowClickFunction: (data: RowData, rowIndexes?: number) => void`
   */
  onRowClick?: GridProps['onRowClick'];
  /**
   * Callback to be called when a row is selected
   * @param rowIndexes - Updated rowIndexes
   * @param selected - Updated selected value
   * @param allSelected - List of selected data in the `Table`
   * @param selectAll - Denotes selection of all records in `Table`
   */
  onSelect?: (rowIndexes: number[], selected: boolean, allSelected: RowData[], selectAll?: boolean) => void;
  /**
   * Callback to be called on page change in case of withPagination: true
   */
  onPageChange?: PaginationProps['onPageChange'];
  /**
   * Shows tooltip on Head Cell hover
   */
  headCellTooltip?: GridProps['headCellTooltip'];
  /**
   * Shows left separator to all columns
   *
   * **Can be override by Column Schema**
   */
  separator?: GridProps['headCellTooltip'];
}

export type SyncTableProps = SyncProps & SharedTableProps;
export type AsyncTableProps = AsyncProps & SharedTableProps;
export type TableProps = (AsyncTableProps & SyncTableProps);

interface TableState {
  async: boolean;
  data: GridProps['data'];
  schema: GridProps['schema'];
  sortingList: GridProps['sortingList'];
  filterList: GridProps['filterList'];
  page: GridProps['page'];
  totalRecords: GridProps['totalRecords'];
  selectAll: GridProps['selectAll'];
  searchTerm: HeaderProps['searchTerm'];
  loading: GridProps['loading'];
  error: GridProps['error'];
}

export const defaultProps = {
  type: 'data',
  size: 'standard',
  showHead: true,
  showMenu: true,
  multipleSorting: true,
  headerOptions: {},
  withPagination: true,
  paginationType: 'jump',
  page: 1,
  pageSize: 15,
  draggable: true,
  data: [],
  schema: [],
  loading: false,
  error: false,
  loaderSchema: [],
  sortingList: [],
  filterList: {}
};

/**
 * ###Note:
 * 1. Table props types:
 *  - async: fetchData
 *  - sync: data, schema, error, loading, onSearch
 * 2. Sync Table:
 *  - Manually toggle loading/error state to update data, schema.
 */

export class Table extends React.Component<TableProps, TableState> {
  static defaultProps = defaultProps;

  constructor(props: TableProps) {
    super(props);

    const async = ('fetchData' in this.props);
    const data = props.data || [];
    const schema = props.schema || [];

    this.state = {
      async,
      data: !async ? data : [],
      schema: !async ? schema : [],
      page: props.page,
      sortingList: props.sortingList || [],
      filterList: props.filterList || {},
      totalRecords: !async ? data.length : 0,
      loading: !async ? props.loading || false : true,
      error: !async ? props.error || false : false,
      selectAll: getSelectAll([]),
      searchTerm: undefined,
    };

    this.updateData();
  }

  componentDidUpdate(prevProps: TableProps, prevState: TableState) {
    if (!this.state.async) {
      if (prevProps.loading !== this.props.loading
        || prevProps.error !== this.props.error) {
        const {
          data = [],
          schema = []
        } = this.props;
        this.setState({
          data,
          schema,
          loading: this.props.loading || false,
          error: this.props.error || false,
          page: 1,
          totalRecords: data.length || 0,
          sortingList: [],
          filterList: {},
          selectAll: getSelectAll([]),
          searchTerm: undefined
        });
      }
    }

    if (prevState.page !== this.state.page) {
      const { onPageChange } = this.props;
      if (onPageChange) onPageChange(this.state.page);
    }

    if (prevState.page !== this.state.page
      || prevState.filterList !== this.state.filterList
      || prevState.sortingList !== this.state.sortingList
      || prevState.searchTerm !== this.state.searchTerm) {
      if (!this.props.loading) this.updateData();
    }
  }

  updateData = () => {
    const {
      async
    } = this.state;

    if (async) {
      this.setState({
        loading: true
      });
    }

    this.debounceUpdate();
  }

  debounceUpdate = debounce(250, () => {
    const {
      fetchData,
      pageSize,
      withPagination,
      data: dataProp,
      onSearch
    } = this.props;

    const {
      async,
      page,
      sortingList,
      filterList,
      searchTerm
    } = this.state;

    this.onSelect(-1, false);

    const opts = {
      page,
      pageSize,
      sortingList,
      filterList,
      searchTerm,
    };

    if (!this.props.withPagination) {
      delete opts.page;
      delete opts.pageSize;
    }

    if (async) {
      if (fetchData) {
        fetchData(opts)
          .then((res: any) => {
            const data = res.data;
            const schema = this.state.schema.length ? this.state.schema : res.schema;
            this.setState({
              data,
              schema,
              selectAll: getSelectAll(data),
              totalRecords: res.count,
              loading: false,
              error: !data.length
            });
          })
          .catch(() => {
            this.setState({
              loading: false,
              error: true,
              data: []
            });
          });
      }
    } else {
      const {
        schema
      } = this.state;

      const filteredData = filterData(schema, dataProp, filterList);
      const searchedData = onSearch && opts.searchTerm !== undefined
        ? onSearch(filteredData, opts.searchTerm)
        : filteredData;
      const sortedData = sortData(schema, searchedData, sortingList);
      let renderedData = sortedData;
      const totalRecords = sortedData.length;
      if (withPagination && page && pageSize) {
        renderedData = paginateData(renderedData, page, pageSize);
      }

      const renderedSchema = this.state.schema.length ? this.state.schema : schema;

      this.setState({
        totalRecords,
        selectAll: getSelectAll(renderedData),
        schema: renderedSchema,
        data: renderedData,
      });
    }
  });

  onSelect: onSelectFunction = (rowIndexes, selected) => {
    const {
      data
    } = this.state;

    const {
      onSelect
    } = this.props;

    const indexes = [rowIndexes];
    let newData: Data = data;
    if (rowIndexes >= 0) {
      newData = updateBatchData(data, indexes, {
        _selected: selected
      });

      this.setState({
        data: newData,
        selectAll: getSelectAll(newData)
      });
    }

    if (onSelect) {
      onSelect(indexes, selected, rowIndexes === -1 ? [] : newData.filter(d => d._selected));
    }
  }

  onSelectAll: onSelectAllFunction = (selected, selectAll) => {
    const {
      onSelect
    } = this.props;

    const {
      data
    } = this.state;

    const indexes = Array.from({ length: data.length }, (_, i) => i);

    const newData = updateBatchData(data, indexes, {
      _selected: selected
    });

    if (onSelect) {
      onSelect(indexes, selected, newData.filter(d => d._selected), selectAll);
    }

    this.setState({
      data: newData,
      selectAll: getSelectAll(newData)
    });
  }

  onPageChange: PaginationProps['onPageChange'] = newPage => {
    this.setState({
      page: newPage
    });
  }

  updateSchema: updateSchemaFunction = newSchema => {
    this.setState({
      schema: newSchema
    });
  }

  updateSortingList: updateSortingListFunction = newSortingList => {
    const {
      multipleSorting
    } = this.props;

    this.setState({
      sortingList: multipleSorting ? [...newSortingList] : newSortingList.slice(-1),
      page: 1,
    });
  }

  updateFilterList: updateFilterListFunction = newFilterList => {
    this.setState({
      filterList: newFilterList,
      page: 1,
    });
  }

  updateSearchTerm: updateSearchTermFunction = newSearchTerm => {
    this.setState({
      searchTerm: newSearchTerm,
      page: 1
    });
  }

  render() {
    const {
      showHead,
      type,
      size,
      headCellTooltip,
      separator,
      draggable,
      nestedRows,
      nestedRowRenderer,
      withHeader,
      headerOptions,
      withCheckbox,
      showMenu,
      withPagination,
      paginationType,
      pageSize,
      onRowClick,
      // onPageChange: onPageChangeProp,
      // onSelect,
      loaderSchema,
      errorTemplate,
      className
    } = this.props;

    const baseProps = extractBaseProps(this.props);

    const {
      children: headerChildren,
      ...headerAttr
    } = headerOptions as ExternalHeaderProps;

    const classes = className ? ` ${className}` : '';

    const {
      totalRecords,
    } = this.state;
    const totalPages = getTotalPages(totalRecords, pageSize);

    return (
      <div {...baseProps} className={`Table${classes}`}>
        {withHeader && (
          <div className="Table-header">
            <Header
              {...this.state}
              // updateData={updateData}
              updateSchema={this.updateSchema}
              // updateSortingList={updateSortingList}
              updateFilterList={this.updateFilterList}
              updateSearchTerm={this.updateSearchTerm}
              showHead={showHead}
              onSelectAll={this.onSelectAll}
              withCheckbox={withCheckbox}
              withPagination={withPagination}
              {...headerAttr}
            >
              {headerChildren}
            </Header>
          </div>
        )}
        <div className="Table-grid">
          <Grid
            {...this.state}
            updateData={this.updateData}
            updateSchema={this.updateSchema}
            updateSortingList={this.updateSortingList}
            updateFilterList={this.updateFilterList}
            withCheckbox={withCheckbox}
            onSelect={this.onSelect}
            onSelectAll={this.onSelectAll}
            showMenu={showMenu}
            showHead={showHead}
            type={type}
            size={size}
            headCellTooltip={headCellTooltip}
            separator={separator}
            draggable={draggable}
            nestedRows={nestedRows}
            nestedRowRenderer={nestedRowRenderer}
            withPagination={withPagination && totalPages > 1}
            pageSize={pageSize}
            loaderSchema={loaderSchema}
            errorTemplate={errorTemplate}
            onRowClick={onRowClick}
          />
        </div>
        {withPagination && (totalPages > 1) && (
          <div className="Table-pagination">
            <Pagination
              page={this.state.page}
              totalPages={getTotalPages(totalRecords, pageSize)}
              type={paginationType}
              onPageChange={this.onPageChange}
            />
          </div>
        )}
      </div>
    );
  }
}

export default Table;
