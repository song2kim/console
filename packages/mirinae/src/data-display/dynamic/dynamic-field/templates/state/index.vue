<template>
    <span>
        <p-anchor v-if="options.link"
                  :href="options.link"
                  target="_blank"
        >
            <p-status v-bind="statusProps" />
        </p-anchor>
        <p-status v-else
                  v-bind="statusProps"
        />
    </span>
</template>
<script lang="ts">
import { computed, defineComponent } from 'vue';

import { get } from 'lodash';
import type { TranslateResult } from 'vue-i18n';

import type { StateDynamicFieldProps } from '@/data-display/dynamic/dynamic-field/templates/state/type';
import PStatus from '@/data-display/status/PStatus.vue';
import type { StatusProps } from '@/data-display/status/type';
import PAnchor from '@/inputs/anchors/PAnchor.vue';
import { getColor } from '@/utils/helpers';


export default defineComponent<StateDynamicFieldProps>({
    name: 'PDynamicFieldState',
    components: { PStatus, PAnchor },
    props: {
        options: {
            type: Object,
            default: () => ({}),
        },
        data: {
            type: [String, Object, Array, Boolean, Number],
            default: undefined,
        },
        typeOptions: {
            type: Object,
            default: () => ({}),
        },
        extraData: {
            type: Object,
            default: () => ({}),
        },
        handler: {
            type: Function,
            default: undefined,
        },
    },
    setup(props) {
        const statusProps = computed<StatusProps>(() => {
            const options = props.options;
            const data = props.data === undefined || props.data === null ? options.default : props.data;
            const text: TranslateResult = data === null || data === undefined ? '' : String(data);

            return {
                icon: get(options, ['icon', 'image'], null),
                iconColor: getColor(get(options, ['icon', 'color'], null)),
                textColor: getColor(get(options, ['text_color'], null)),
                text: `${options.prefix ?? ''}${text}${options.postfix ?? ''}`,
            };
        });


        return { statusProps };
    },
});
</script>
