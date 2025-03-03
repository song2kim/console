<template>
    <div class="set-filter-part"
         :class="{responsive: !printMode}"
    >
        <p class="applied-filter">
            <span class="label">{{ $t('BILLING.COST_MANAGEMENT.MAIN.APPLIED_FILTER') }}: </span>
            <span class="text">{{ filterLabel }}</span>
        </p>
        <p-button v-if="!showSetting && !noFilter && !printMode"
                  style-type="tertiary"
                  size="sm"
                  @click.stop="handleClickViewFilter"
        >
            {{ $t('BILLING.COST_MANAGEMENT.MAIN.VIEW_FILTER') }}
        </p-button>
        <p-icon-button v-if="showSetting"
                       name="ic_settings-filled"
                       style-type="tertiary"
                       size="sm"
                       @click="handleClickSelectFilter"
        />
        <view-filter-modal :visible.sync="viewFilterModalVisible"
                           :selected-filters="filters"
        />
        <cost-explorer-set-filter-modal :visible.sync="selectFilterModalVisible"
                                        :categories="FILTER_CATEGORIES"
                                        :prev-selected-filters="filters"
                                        @confirm="handleConfirmSetFilter"
        />
    </div>
</template>

<script lang="ts">
import type { SetupContext } from 'vue';
import {
    computed, defineComponent, reactive, toRefs,
} from 'vue';

import { PButton, PIconButton } from '@spaceone/design-system';
import { isEmpty } from 'lodash';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { store } from '@/store';
import { i18n } from '@/translations';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import ErrorHandler from '@/common/composables/error/errorHandler';
import { useProxyValue } from '@/common/composables/proxy-state';

import { DASHBOARD_TYPE } from '@/services/cost-explorer/cost-dashboard/lib/config';
import { getCostDashboardFilterLabel } from '@/services/cost-explorer/cost-dashboard/lib/helper';
import ViewFilterModal from '@/services/cost-explorer/cost-dashboard/modules/ViewFilterModal.vue';
import { FILTER } from '@/services/cost-explorer/lib/config';
import CostExplorerSetFilterModal from '@/services/cost-explorer/modules/CostExplorerSetFilterModal.vue';
import type { CostFiltersMap } from '@/services/cost-explorer/type';

interface Props {
    dashboardId: string;
    filters: CostFiltersMap;
    printMode: boolean;
    manageDisabled: boolean;
}

const FILTER_CATEGORIES = [FILTER.PROJECT_GROUP, FILTER.PROJECT, FILTER.SERVICE_ACCOUNT, FILTER.PROVIDER];

export default defineComponent<Props>({
    name: 'CostDashboardFilter',
    components: {
        ViewFilterModal,
        CostExplorerSetFilterModal,
        PButton,
        PIconButton,
    },
    props: {
        dashboardId: {
            type: String,
            default: '',
        },
        /* sync */
        filters: {
            type: Object,
            default: () => ({}),
        },
        printMode: {
            type: Boolean,
            default: false,
        },
        manageDisabled: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }: SetupContext) {
        const state = reactive({
            proxyFilters: useProxyValue<CostFiltersMap>('filters', props, emit),
            filterLabel: computed(() => {
                const label = getCostDashboardFilterLabel(props.filters);
                return label ?? i18n.t('BILLING.COST_MANAGEMENT.MAIN.FILTER_NONE');
            }),
            noFilter: computed(() => isEmpty(props.filters) || Object.values(props.filters).every((d) => !d.length)),
            viewFilterModalVisible: false,
            selectFilterModalVisible: false,
            isUserDashboard: computed(() => (props.dashboardId?.startsWith(DASHBOARD_TYPE.USER))),
            showSetting: computed(() => ((props.manageDisabled && state.isUserDashboard) || !props.manageDisabled) && !props.printMode),
        });

        /* api */
        const updatePublicDashboardFilters = async (filters: CostFiltersMap) => {
            try {
                await SpaceConnector.client.costAnalysis.publicDashboard.update({
                    public_dashboard_id: props.dashboardId,
                    default_filter: filters,
                });
                state.proxyFilters = filters;
                showSuccessMessage(i18n.t('BILLING.COST_MANAGEMENT.MAIN.ALT_S_EDIT_FILTER'), '');
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('BILLING.COST_MANAGEMENT.MAIN.ALT_E_EDIT_FILTER'));
            }
        };

        const updateUserDashboardFilters = async (filters: CostFiltersMap) => {
            try {
                await SpaceConnector.client.costAnalysis.userDashboard.update({
                    user_dashboard_id: props.dashboardId,
                    default_filter: filters,
                });
                state.proxyFilters = filters;
                showSuccessMessage(i18n.t('BILLING.COST_MANAGEMENT.MAIN.ALT_S_EDIT_FILTER'), '');
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('BILLING.COST_MANAGEMENT.MAIN.ALT_E_EDIT_FILTER'));
            }
        };

        /* event */
        const handleClickSelectFilter = () => {
            state.selectFilterModalVisible = true;
        };
        const handleClickViewFilter = () => {
            state.viewFilterModalVisible = true;
        };
        const handleConfirmSetFilter = (filters: CostFiltersMap) => {
            if (state.isUserDashboard) {
                updateUserDashboardFilters(filters);
            } else {
                updatePublicDashboardFilters(filters);
            }
        };

        // LOAD REFERENCE STORE
        (async () => {
            await Promise.allSettled([
                store.dispatch('reference/project/load'),
                store.dispatch('reference/serviceAccount/load'),
                store.dispatch('reference/provider/load'),
            ]);
        })();

        return {
            ...toRefs(state),
            FILTER_CATEGORIES,
            handleClickSelectFilter,
            handleClickViewFilter,
            handleConfirmSetFilter,
        };
    },
});
</script>

<style lang="postcss" scoped>
.set-filter-part {
    @apply flex items-center;
    width: 100%;
    .applied-filter {
        margin-right: 0.5rem;
        white-space: nowrap;
        .text {
            @apply text-gray-800;
        }
    }
    &.responsive {
        @screen mobile {
            @apply flex flex-wrap;
            .applied-filter {
                width: 100%;
                .label {
                    display: none;
                }
            }
        }
    }
}

</style>
