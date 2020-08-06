import { QuerySearchTableProps } from '@/components/organisms/tables/query-search-table/type';
import { DynamicLayoutTemplateProps, QuerySearchTableOptions } from '@/components/organisms/dynamic-layout/type';

export type QuerySearchDynamicLayoutProps<T=any> = DynamicLayoutTemplateProps<
    Partial<QuerySearchTableProps>,
    QuerySearchTableOptions,
    T[]
    >
