<template>
    <div class="dashboard-variable-selector">
        <template v-for="(propertyName, idx) in variableState.order">
            <variable-selector-dropdown v-if="variableState.variableProperties[propertyName]?.use"
                                        :key="`${propertyName}-${idx}`"
                                        :property-name="propertyName"
                                        :reference-map="variableState.allReferenceTypeInfo[propertyName]?.referenceMap"
            />
        </template>
        <variable-more-button-dropdown :is-manageable="props.isManageable" />
        <button class="reset-button"
                @click="dashboardDetailStore.resetVariables"
        >
            <p-i name="ic_refresh"
                 width="1rem"
                 height="1rem"
                 color="inherit"
            />
            <span>{{ $t('DASHBOARDS.CUSTOMIZE.RESET') }}</span>
        </button>
        <dashboard-manage-variable-overlay :visible="variableState.showOverlay" />
    </div>
</template>

<script lang="ts" setup>

import type Vue from 'vue';
import { computed, getCurrentInstance, reactive } from 'vue';

import { PI } from '@spaceone/design-system';

import { store } from '@/store';

import { MANAGE_VARIABLES_HASH_NAME } from '@/services/dashboards/config';
import DashboardManageVariableOverlay
    from '@/services/dashboards/dashboard-customize/modules/dashboard-manage-variable-overlay/DashboardManageVariableOverlay.vue';
import VariableMoreButtonDropdown
    from '@/services/dashboards/dashboard-customize/modules/VariableMoreButtonDropdown.vue';
import VariableSelectorDropdown from '@/services/dashboards/dashboard-customize/modules/VariableSelectorDropdown.vue';
import { useDashboardDetailInfoStore } from '@/services/dashboards/store/dashboard-detail-info';

interface Props {
    isManageable: boolean;
}

const props = defineProps<Props>();

const dashboardDetailStore = useDashboardDetailInfoStore();
const dashboardDetailState = dashboardDetailStore.$state;

const vm = getCurrentInstance()?.proxy as Vue;

const variableState = reactive({
    showOverlay: computed(() => vm.$route.hash === `#${MANAGE_VARIABLES_HASH_NAME}`),
    variableProperties: computed(() => dashboardDetailState.variablesSchema.properties),
    order: computed(() => dashboardDetailState.variablesSchema.order),
    allReferenceTypeInfo: computed(() => store.getters['reference/allReferenceTypeInfo']),
});

</script>

<style lang="postcss" scoped>
.reset-button {
    @apply flex items-center text-label-md text-blue-700;
    gap: 0.25rem;
}
</style>
