<template>
    <div class="cost-analysis-period-select-dropdown"
         :class="{responsive: !printMode}"
    >
        <p-badge style-type="gray200"
                 badge-type="subtle"
        >
            <p class="text">
                {{ periodText }}
            </p>
        </p-badge>
        <p-select-dropdown v-if="!printMode"
                           :items="periodMenuItems"
                           :selected="selectedPeriod"
                           style-type="transparent"
                           @select="handleSelectPeriod"
        />
        <custom-date-range-modal v-if="customRangeModalVisible"
                                 :visible.sync="customRangeModalVisible"
                                 :granularity="granularity"
                                 @confirm="handleCustomRangeModalConfirm"
        />
    </div>
</template>

<script lang="ts">

import {
    computed, defineComponent, reactive, toRefs, watch,
} from 'vue';
import type { TranslateResult } from 'vue-i18n';

import { PBadge, PSelectDropdown } from '@spaceone/design-system';
import type { MenuItem } from '@spaceone/design-system/types/inputs/context-menu/type';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { i18n } from '@/translations';

import { useI18nDayjs } from '@/common/composables/i18n-dayjs';
import { useProxyValue } from '@/common/composables/proxy-state';

import type { DateRange } from '@/services/dashboards/config';
import CustomDateRangeModal from '@/services/dashboards/widgets/_components/CustomDateRangeModal.vue';
import type { Granularity } from '@/services/dashboards/widgets/_configs/config';
import { GRANULARITY } from '@/services/dashboards/widgets/_configs/config';
import { getInitialDates } from '@/services/dashboards/widgets/_helpers/date-range-helper';

const today = dayjs.utc();
interface PeriodItem {
    name: string;
    label: TranslateResult;
    start: Dayjs;
    end: Dayjs;
    enabled: Granularity[];
}

export default defineComponent({
    name: 'DateRangeSelector',
    components: {
        CustomDateRangeModal,
        PSelectDropdown,
        PBadge,
    },
    props: {
        dateRange: {
            type: Object,
            default: () => (getInitialDates()),
        },
        granularity: {
            type: String,
            default: GRANULARITY.MONTHLY,
        },
        printMode: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const { i18nDayjs } = useI18nDayjs();
        const dateFormatter = (date: string, format: string) => i18nDayjs.value.utc(date).format(format);
        const state = reactive({
            proxyDateRange: useProxyValue('dateRange', props, emit),
            periodItems: computed<PeriodItem[]>(() => ([
                {
                    name: 'last7days',
                    label: i18n.t('DASHBOARDS.DETAIL.PERIOD_LAST_7_DAYS'),
                    start: today.subtract(6, 'day'),
                    end: today,
                    enabled: [GRANULARITY.DAILY, GRANULARITY.ACCUMULATED],
                },
                {
                    name: 'last14days',
                    label: i18n.t('DASHBOARDS.DETAIL.PERIOD_LAST_14_DAYS'),
                    start: today.subtract(13, 'day'),
                    end: today,
                    enabled: [GRANULARITY.DAILY, GRANULARITY.ACCUMULATED],
                },
                {
                    name: 'thisMonth',
                    label: i18n.t('DASHBOARDS.DETAIL.PERIOD_THIS_MONTH'),
                    start: today.startOf('month'),
                    end: today.endOf('month'),
                    enabled: [GRANULARITY.DAILY, GRANULARITY.MONTHLY, GRANULARITY.ACCUMULATED],
                },
                {
                    name: 'lastMonth',
                    label: i18n.t('DASHBOARDS.DETAIL.PERIOD_LAST_MONTH'),
                    start: today.subtract(1, 'month').startOf('month'),
                    end: today.subtract(1, 'month').endOf('month'),
                    enabled: [GRANULARITY.DAILY, GRANULARITY.MONTHLY, GRANULARITY.ACCUMULATED],
                },
                {
                    name: 'last3Month',
                    label: i18n.t('DASHBOARDS.DETAIL.PERIOD_LAST_3_MONTHS'),
                    start: today.subtract(2, 'month').startOf('month'),
                    end: today.endOf('month'),
                    enabled: [GRANULARITY.MONTHLY, GRANULARITY.ACCUMULATED],
                },
                {
                    name: 'last6Month',
                    label: i18n.t('DASHBOARDS.DETAIL.PERIOD_LAST_6_MONTHS'),
                    start: today.subtract(5, 'month').startOf('month'),
                    end: today.endOf('month'),
                    enabled: [GRANULARITY.MONTHLY, GRANULARITY.ACCUMULATED],
                },
            ])),
            periodMenuItems: computed<MenuItem[]>(() => {
                const menuItems = state.periodItems.filter((d) => d.enabled.includes(props.granularity));
                return [
                    ...menuItems,
                    {
                        type: 'divider',
                    },
                    {
                        type: 'item',
                        name: 'custom',
                        label: i18n.t('DASHBOARDS.DETAIL.PERIOD_CUSTOM'),
                    },
                ];
            }),
            selectedPeriod: 'thisMonth',
            customRangeModalVisible: false,
            periodText: computed(() => {
                const isSameMonth: boolean = dateFormatter(state.proxyDateRange.start, 'M') === dateFormatter(state.proxyDateRange.end, 'M');
                const start = state.proxyDateRange.start;
                const end = state.proxyDateRange.end;
                if (isSameMonth) {
                    return `${dateFormatter(start, 'MMMM D')} ~ ${dateFormatter(end, 'D')}, ${dateFormatter(end, 'YYYY')}`;
                }
                if (props.granularity === GRANULARITY.MONTHLY) {
                    return `${dateFormatter(start, 'MMMM')}, ${dateFormatter(start, 'YYYY')} ~ ${dateFormatter(end, 'MMMM')}, ${dateFormatter(end, 'YYYY')}`;
                }
                return `${dateFormatter(start, 'MMMM D')}, ${dateFormatter(start, 'YYYY')} ~ ${dateFormatter(end, 'MMMM D')}, ${dateFormatter(end, 'YYYY')}`;
            }),
        });

        /* Util */
        const setPeriod = (dateRange: DateRange) => {
            state.proxyDateRange = dateRange;
            emit('update', dateRange);
        };
        const setPeriodMenuItemWithPeriod = (dateRange?: DateRange) => {
            const start = dayjs.utc(dateRange?.start);
            const end = dayjs.utc(dateRange?.end);
            let selectedMenu = 'custom';
            const unit = GRANULARITY.DAILY ? 'day' : 'month';
            state.periodItems.forEach((d) => {
                if (start.isSame(d.start, unit) && end.isSame(d.end, unit)) {
                    selectedMenu = d.name;
                }
            });
            state.selectedPeriod = selectedMenu;
        };

        /* Event */
        const handleSelectPeriod = (periodMenuName) => {
            state.selectedPeriod = periodMenuName;
            if (periodMenuName === 'custom') state.customRangeModalVisible = true;
            else {
                const selectedPeriodItem: PeriodItem = state.periodItems.find((d) => d.name === periodMenuName);
                setPeriod({
                    start: selectedPeriodItem.start.format(),
                    end: selectedPeriodItem.end.format(),
                });
            }
        };
        const handleCustomRangeModalConfirm = (dateRange: DateRange) => {
            setPeriod(dateRange);
            state.customRangeModalVisible = false;
        };

        /* Watcher */
        watch(() => state.proxyDateRange, (dateRange) => {
            if (dateRange) {
                setPeriodMenuItemWithPeriod(dateRange);
            }
        });

        return {
            ...toRefs(state),
            handleSelectPeriod,
            handleCustomRangeModalConfirm,
        };
    },
});
</script>
<style lang="postcss" scoped>
.cost-analysis-period-select-dropdown {
    .p-badge {
        margin-right: 0.5rem;
        .text {
            white-space: nowrap;
        }
    }
    &.responsive {
        @screen mobile {
            @apply flex flex-wrap justify-end items-center;
            width: 100%;
        }
    }
}

</style>
