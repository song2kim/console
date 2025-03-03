<template>
    <div class="cost-analysis-header"
         :class="{'interactive-mode': !printMode}"
    >
        <section class="title-section">
            <p-heading :title="costAnalysisPageState.selectedQueryId ? title : defaultTitle">
                <template #title-left-extra>
                    <p-select-dropdown v-if="!printMode"
                                       :items="costQueryMenuItems"
                                       style-type="icon-button"
                                       button-icon="ic_list-bulleted-3"
                                       class="list-button"
                                       @select="handleClickQueryItem"
                    >
                        <template #menu-item--format="{item}">
                            <div class="query-item-wrapper">
                                <div class="dropdown-item-wrapper">
                                    <span>{{ item.label }}</span><span v-if="!item.name"
                                                                       class="default-item-suffix"
                                    >(default)</span>
                                </div>
                                <div v-if="item.name"
                                     class="button-wrapper"
                                >
                                    <p-icon-button name="ic_delete"
                                                   size="sm"
                                                   @click.stop="handleClickDeleteQuery(item.name)"
                                    />
                                    <p-icon-button name="ic_edit-text"
                                                   size="sm"
                                                   @click.stop="handleClickEditQuery(item.name)"
                                    />
                                </div>
                            </div>
                        </template>
                    </p-select-dropdown>
                </template>
                <template v-if="!printMode"
                          #title-right-extra
                >
                    <div v-if="!printMode && costAnalysisPageState.selectedQueryId"
                         class="button-wrapper"
                    >
                        <p-icon-button name="ic_delete"
                                       @click.stop="handleClickDeleteQuery(costAnalysisPageState.selectedQueryId)"
                        />
                        <p-icon-button name="ic_edit-text"
                                       @click.stop="handleClickEditQuery(costAnalysisPageState.selectedQueryId)"
                        />
                    </div>
                    <div class="button-wrapper extra">
                        <pdf-download-button @click="handleClickPdf" />
                        <p-button v-if="costAnalysisPageState.selectedQueryId"
                                  style-type="tertiary"
                                  @click="handleSaveQueryOption"
                        >
                            {{ $t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.SAVE') }}
                        </p-button>
                        <p-button style-type="tertiary"
                                  @click="handleClickSaveQuery"
                        >
                            {{ $t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.SAVE_AS') }}
                        </p-button>
                    </div>
                </template>
            </p-heading>
        </section>
        <cost-analysis-save-query-form-modal v-if="!printMode"
                                             :header-title="saveQueryFormState.title"
                                             :visible.sync="saveQueryFormState.visible"
                                             :selected-query="saveQueryFormState.selectedQuery"
                                             :request-type="saveQueryFormState.requestType"
                                             @confirm="handleSaveQueryConfirm"
        />
        <delete-modal v-if="!printMode"
                      :header-title="$t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.CHECK_DELETE_MODAL_DESC')"
                      :visible.sync="checkDeleteState.visible"
                      @confirm="handleDeleteQueryConfirm"
        />
        <pdf-download-overlay v-if="!printMode"
                              v-model="visiblePdfOverlay"
                              :items="previewItems"
                              orientation="landscape"
                              :file-name="pdfFileName"
                              :font-language="pdfFontLanguage"
        >
            <cost-analysis-preview @rendered="handlePreviewRendered" />
        </pdf-download-overlay>
    </div>
</template>

<script lang="ts">
import {
    computed, reactive, toRefs, watch,
} from 'vue';
import type { TranslateResult } from 'vue-i18n';

import {
    PButton, PIconButton, PHeading, PSelectDropdown,
} from '@spaceone/design-system';
import type { MenuItem } from '@spaceone/design-system/types/inputs/context-menu/type';
import dayjs from 'dayjs';

import { SpaceConnector } from '@cloudforet/core-lib/space-connector';

import { SpaceRouter } from '@/router';
import { store } from '@/store';
import { i18n } from '@/translations';

import { CURRENCY } from '@/store/modules/display/config';

import { showSuccessMessage } from '@/lib/helper/notice-alert-helper';

import type { Item } from '@/common/components/layouts/PdfDownloadOverlay/PdfDownloadOverlay.vue';
import ErrorHandler from '@/common/composables/error/errorHandler';

import type { SaveQueryEmitParam } from '@/services/cost-explorer/cost-analysis/CostAnalysisPage.vue';
import type { RequestType } from '@/services/cost-explorer/cost-analysis/lib/config';
import { REQUEST_TYPE } from '@/services/cost-explorer/cost-analysis/lib/config';
import { COST_EXPLORER_ROUTE } from '@/services/cost-explorer/route-config';
import { useCostAnalysisPageStore } from '@/services/cost-explorer/store/cost-analysis-page-store';
import type { CostQuerySetModel } from '@/services/cost-explorer/type';

const CostAnalysisSaveQueryFormModal = () => import('@/services/cost-explorer/cost-analysis/modules/CostAnalysisSaveQueryFormModal.vue');
const DeleteModal = () => import('@/common/components/modals/DeleteModal.vue');
const PdfDownloadOverlay = () => import('@/common/components/layouts/PdfDownloadOverlay/PdfDownloadOverlay.vue');
const CostAnalysisPreview = () => import('@/services/cost-explorer/cost-analysis/modules/CostAnalysisPreview.vue');
const PdfDownloadButton = () => import('@/common/components/buttons/PdfDownloadButton.vue');


export default {
    name: 'CostAnalysisHeader',
    components: {
        CostAnalysisPreview,
        PdfDownloadOverlay,
        DeleteModal,
        CostAnalysisSaveQueryFormModal,
        PdfDownloadButton,
        PHeading,
        PIconButton,
        PSelectDropdown,
        PButton,
    },
    props: {
        printMode: {
            type: Boolean,
            default: false,
        },
    },
    setup() {
        const costAnalysisPageStore = useCostAnalysisPageStore();
        const costAnalysisPageState = costAnalysisPageStore.$state;

        const state = reactive({
            defaultTitle: computed<TranslateResult>(() => i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.COST_ANALYSIS')),
            costQueryMenuItems: computed<MenuItem[]>(() => ([
                { name: 'header', label: i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.SAVED_QUERY'), type: 'header' },
                { name: undefined, label: 'Cost Analysis', type: 'item' },
                ...costAnalysisPageState.costQueryList.map((item: CostQuerySetModel): MenuItem => ({
                    name: item.cost_query_set_id,
                    label: item.name,
                    type: 'item',
                })),
            ])),
            title: computed<string>(() => costAnalysisPageStore.selectedQuerySet?.name ?? 'Cost Analysis'),
            itemIdForDeleteQuery: '',
            visiblePdfOverlay: false,
            pdfFileName: computed<string>(() => `${costAnalysisPageStore.selectedQuerySet?.name ?? 'Cost_Analysis'}_${dayjs().format('YYYYMMDD')}`),
            previewItems: [] as Item[],
            currency: computed(() => store.state.display.currency),
            pdfFontLanguage: computed<string>(() => {
                // https://pdfmake.github.io/docs/0.1/fonts/custom-fonts-client-side/url/
                if (state.currency === CURRENCY.USD) return 'en';
                if (state.currency === CURRENCY.KRW) return 'ko';
                return 'jp';
            }),
        });

        const saveQueryFormState = reactive({
            visible: false,
            title: '' as string | TranslateResult,
            selectedQuery: {},
            requestType: REQUEST_TYPE.SAVE as RequestType,
        });

        const checkDeleteState = reactive({
            visible: false,
        });

        /* Utils */
        const getQueryWithKey = (queryItemKey: string): Partial<CostQuerySetModel> => (costAnalysisPageState.costQueryList.find((item) => item.cost_query_set_id === queryItemKey)) || {};

        /* Event Handlers */
        const handleClickQueryItem = async (queryId: string) => {
            if (queryId === costAnalysisPageState.selectedQueryId) return;

            if (queryId) {
                const { options } = getQueryWithKey(queryId);
                await costAnalysisPageStore.setQueryOptions(options);
                costAnalysisPageStore.$patch({ selectedQueryId: queryId });
            } else {
                await costAnalysisPageStore.setQueryOptions();
                costAnalysisPageStore.$patch({ selectedQueryId: undefined });
            }
        };

        const handleClickDeleteQuery = (id: string) => {
            state.itemIdForDeleteQuery = id;
            checkDeleteState.visible = true;
        };

        const handleClickEditQuery = (queryItemId: string) => {
            const queryItem = getQueryWithKey(queryItemId);
            saveQueryFormState.title = i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.EDIT_QUERY');
            saveQueryFormState.requestType = REQUEST_TYPE.EDIT;
            saveQueryFormState.selectedQuery = queryItem;
            saveQueryFormState.visible = true;
        };
        const handleClickSaveQuery = () => {
            saveQueryFormState.title = i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.SAVE_QUERY');
            saveQueryFormState.requestType = REQUEST_TYPE.SAVE;
            saveQueryFormState.visible = true;
        };

        const handleSaveQueryConfirm = ({ updatedQuery, requestType }: SaveQueryEmitParam) => {
            if (!updatedQuery) return;

            costAnalysisPageStore.listCostQueryList();

            if (requestType === REQUEST_TYPE.EDIT && updatedQuery.cost_query_set_id !== costAnalysisPageState.selectedQueryId) {
                return;
            }

            if (requestType === REQUEST_TYPE.SAVE) {
                costAnalysisPageStore.$patch({ selectedQueryId: updatedQuery.cost_query_set_id });
            }
        };

        const handleSaveQueryOption = async () => {
            try {
                await SpaceConnector.client.costAnalysis.costQuerySet.update({
                    cost_query_set_id: costAnalysisPageState.selectedQueryId,
                    options: {
                        granularity: costAnalysisPageState.granularity,
                        stack: costAnalysisPageState.stack,
                        period: costAnalysisPageState.period,
                        group_by: costAnalysisPageState.groupBy,
                        primary_group_by: costAnalysisPageState.primaryGroupBy, // will be deprecated(< v1.10.5)
                        more_group_by: costAnalysisPageState.moreGroupBy, // will be deprecated(< v1.10.5)
                        filters: costAnalysisPageState.filters,
                    },
                });
                await costAnalysisPageStore.listCostQueryList();
                showSuccessMessage(i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_S_SAVED_QUERY'), '');
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_E_SAVED_QUERY'));
            }
        };

        const handleDeleteQueryConfirm = async () => {
            checkDeleteState.visible = false;
            try {
                await SpaceConnector.client.costAnalysis.costQuerySet.delete({ cost_query_set_id: state.itemIdForDeleteQuery });
                await costAnalysisPageStore.listCostQueryList();
                showSuccessMessage(i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_S_DELETE_QUERY'), '');
                if (costAnalysisPageState.selectedQueryId === state.itemIdForDeleteQuery) {
                    await SpaceRouter.router.push({ name: COST_EXPLORER_ROUTE.COST_ANALYSIS._NAME });
                    await costAnalysisPageStore.setQueryOptions();
                    costAnalysisPageStore.$patch({ selectedQueryId: undefined });
                }
            } catch (e) {
                ErrorHandler.handleRequestError(e, i18n.t('BILLING.COST_MANAGEMENT.COST_ANALYSIS.ALT_E_DELETE_QUERY'));
            }
        };

        const handleClickPdf = () => {
            state.visiblePdfOverlay = true;
        };

        const handlePreviewRendered = (items: Item[]) => {
            state.previewItems = items;
        };

        /* Watchers */
        watch(() => saveQueryFormState.visible, () => {
            if (saveQueryFormState.visible === false) saveQueryFormState.selectedQuery = {};
        });

        return {
            ...toRefs(state),
            costAnalysisPageState,
            saveQueryFormState,
            checkDeleteState,
            handleClickQueryItem,
            handleClickDeleteQuery,
            handleClickEditQuery,
            handleClickSaveQuery,
            handleSaveQueryConfirm,
            handleSaveQueryOption,
            handleDeleteQueryConfirm,
            handleClickPdf,
            handlePreviewRendered,
        };
    },
};
</script>

<style lang="postcss" scoped>
.cost-analysis-header {
    .title-section {
        @apply relative;
        display: flex;
    }

    .button-wrapper {
        @apply flex-shrink-0 inline-flex items-center;
        &.extra {
            @apply gap-4 justify-end;
            float: right;
        }
    }
    .dropdown-item-wrapper {
        @apply flex items-center gap-1;

        .default-item-suffix {
            @apply text-gray-400;
        }
    }

    /* custom design-system component - p-button-modal */
    :deep(.p-button-modal) {
        display: block;
    }

    /* custom design-system component - p-select-dropdown */
    :deep(.list-button) {
        @apply bg-transparent;
        display: inline-flex;
        .p-context-menu {
            min-width: 22rem;

            .menu-item-wrapper {
                display: flex;
                justify-content: space-between;
            }
        }
    }

    .query-item-wrapper {
        @apply flex justify-between;
        width: 100%;
    }

    &.interactive-mode {
        @screen mobile {
            .button-wrapper.extra {
                margin-top: 1rem;
                width: 100%;
            }
        }
    }
}
</style>
