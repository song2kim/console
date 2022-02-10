import Layout1WidgetList from '@/services/billing/cost-management/cost-dashboard/dashboard-layouts/layout-1.json';
import Layout4WidgetList from '@/services/billing/cost-management/cost-dashboard/dashboard-layouts/layout-4.json';
import { DefaultLayout } from '@/services/billing/cost-management/cost-dashboard/type';

export const defaultLayoutMap = {
    'layout-1': {
        default_layout_id: 'layout-1',
        name: 'Cost Overview',
        widgetList: Layout1WidgetList,
    },
    'layout-4': {
        default_layout_id: 'layout-4',
        name: 'CDN & Traffic Cost',
        widgetList: Layout4WidgetList,
    },
};
export const defaultLayoutList: Record<string, DefaultLayout> = {
    ...{ blank: { name: 'Blank', widgetList: [] } },
    ...{ 'layout-1': { ...defaultLayoutMap['layout-1'] } },
    ...{ 'layout-4': { ...defaultLayoutMap['layout-4'] } },
};
export const defaultLayoutData = Object.values(defaultLayoutList);
