import {
    toRefs, reactive, ref, computed,
} from '@vue/composition-api';
import { action } from '@storybook/addon-actions';
import {
    text, number, select, object, boolean,
} from '@storybook/addon-knobs/vue';
import casual, { arrayOf } from '@/components/util/casual';
import { KeyItem, ValueItem } from '@/components/organisms/search/query-search/type';
import PQuerySearchTable from './PQuerySearchTable.vue';

export default {
    title: 'organisms/tables/QuerySearchTable',
    component: PQuerySearchTable,
    parameters: {
        info: {
            summary: '',
            components: { PQuerySearchTable },
        },
        knobs: { escapeHTML: false },
    },
};

const getHandler = items => async (inputText, keyItem) => {
    const allItems = items.map(d => ({ name: d, label: d }));
    let res = [...allItems];
    const regex = RegExp(inputText, 'i');

    if (inputText) {
        res = allItems.reduce((result, d) => {
            if (regex.test(d.label) || regex.test(d.name)) result.push(d);
            return result;
        }, []);
    }
    return {
        results: res,
        totalCount: allItems.length,
    };
};

export const defaultCase = () => ({
    components: { PQuerySearchTable },
    props: {
        fields: {
            default: object('fields', [
                { name: 'id', label: 'ID' },
                { name: 'name', label: 'Name' },
                { name: 'group', label: 'Group' },
            ]),
        },
        items: {
            default: object('items', arrayOf(10, () => ({
                id: casual.uuid, name: casual.word, group: casual.word,
            }))),
        },
        loading: {
            default: boolean('loading', false),
        },
        sortBy: {
            default: text('sortBy', 'id'),
        },
        selectIndex: {
            default: object('selectIndex', []),
        },
        thisPage: {
            default: number('thisPage', 1),
        },
        pageSize: {
            default: number('pageSize', 10),
        },
        totalCount: {
            default: number('totalCount', 50),
        },
        keyItems: {
            default: object('keyItems', [
                { name: 'id', label: 'ID' },
                { name: 'name', label: 'Name' },
                { name: 'group', label: 'Group' },
            ]),
        },
        valueHandlerMap: {
            default: object('valueHandlerMap', {
                id: getHandler(arrayOf(10, () => casual.word)),
                name: getHandler(arrayOf(10, () => casual.word)),
                group: getHandler(arrayOf(10, () => casual.word)),
            }),
        },
        queryTags: {
            default: object('queryTags', [
                {
                    operator: '',
                    value: { name: 'wanjin', label: 'Wanjin Noh' },
                },
            ]),
        },
    },
    template: `
    <div style="width: 80vw;">
        <PQuerySearchTable v-bind="$props"
                           @change="onChange"
                           @export="onExport"
                           @select="onSelect"
        ></PQuerySearchTable>
    </div>`,
    setup(props, context) {
        const state = reactive({});

        return {
            ...toRefs(state),
            onChange: action('change'),
            onExport: action('export'),
            onSelect: action('select'),
        };
    },
});
