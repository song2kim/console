<template>
    <div v-click-outside="hideSiteMap"
         class="sitemap-container"
         :class="{'disabled': disabled}"
         @click.stop
    >
        <div class="sitemap-button"
             :class="visible ? 'visible' : ''"
             role="button"
             tabindex="0"
             @click="handleSiteMapButtonClick"
             @keydown.enter="showSiteMap"
             @keydown.esc="hideSiteMap"
        >
            <p-i class="sitemap-icon"
                 :name="visible ? 'ic_close' : 'ic_gnb_menu'"
                 color="inherit"
                 width="2rem"
                 height="2rem"
            />
        </div>
        <ul v-if="visible"
            class="sitemap"
        >
            <template v-for="(menu, menuIdx) in menuList">
                <template v-if="menu.show !== false">
                    <li :key="menuIdx">
                        <router-link :to="menu.to"
                                     custom
                        >
                            <template #default="{href, navigate}">
                                <a class="menu"
                                   :href="href"
                                   @click.stop="navigateToMenu(navigate, $event)"
                                   @keydown.enter="navigateToMenu(navigate, $event)"
                                >
                                    <p-i :name="menu.icon"
                                         color="inherit inherit"
                                         height="1.5rem"
                                         width="1.5rem"
                                    /> {{ menu.label }}
                                </a>
                            </template>
                        </router-link>
                    </li>

                    <template v-if="menu.subMenuList && menu.subMenuList.length > 0 && menu.id !== MENU_ID.DASHBOARDS">
                        <template v-for="(subMenu, subMenuIdx) in menu.subMenuList">
                            <template v-if="subMenu.show !== false">
                                <li v-if="subMenu"
                                    :key="`${menuIdx}-${subMenuIdx}`"
                                >
                                    <router-link :to="subMenu.to"
                                                 custom
                                    >
                                        <template #default="{href, navigate}">
                                            <a class="submenu"
                                               :href="href"
                                               @click.stop="navigateToMenu(navigate, $event)"
                                               @keydown.enter="navigateToMenu(navigate, $event)"
                                            >
                                                {{ subMenu.label }}
                                                <new-mark v-if="subMenu.isNew" />
                                                <beta-mark v-if="subMenu.isBeta" />
                                            </a>
                                        </template>
                                    </router-link>
                                </li>
                            </template>
                        </template>
                    </template>
                </template>
            </template>
        </ul>
    </div>
</template>

<script lang="ts">

import type { PropType, SetupContext } from 'vue';

import { PI } from '@spaceone/design-system';
import vClickOutside from 'v-click-outside';

import type { DisplayMenu } from '@/store/modules/display/type';

import { MENU_ID } from '@/lib/menu/config';

import BetaMark from '@/common/components/marks/BetaMark.vue';
import NewMark from '@/common/components/marks/NewMark.vue';


export default {
    name: 'SiteMap',
    components: {
        BetaMark,
        NewMark,
        PI,
    },
    directives: {
        clickOutside: vClickOutside.directive,
    },
    props: {
        disabled: {
            type: Boolean,
            default: false,
        },
        visible: {
            type: Boolean,
            default: false,
        },
        menuList: {
            type: Array as PropType<DisplayMenu[]>,
            default: () => ([]),
        },
    },
    setup(props, { emit }: SetupContext) {
        const showSiteMap = () => {
            emit('update:visible', true);
        };
        const hideSiteMap = () => {
            emit('update:visible', false);
        };
        const handleSiteMapButtonClick = () => {
            if (!props.disabled) {
                emit('update:visible', !props.visible);
            }
        };
        const navigateToMenu = (navigate, e) => {
            navigate(e);
            hideSiteMap();
        };

        return {
            showSiteMap,
            hideSiteMap,
            handleSiteMapButtonClick,
            navigateToMenu,
            MENU_ID,
        };
    },
};
</script>

<style lang="postcss" scoped>
.sitemap-container {
    @apply relative;

    .sitemap-button {
        @apply text-gray-900;
        position: relative;
        cursor: pointer;
        text-decoration: none;
        &:hover, &.visible {
            @apply text-violet-600;
            .sitemap-icon {
                @apply bg-violet-200;
            }
        }
        .sitemap-icon {
            @apply rounded-full;
        }
    }
    .sitemap {
        @apply bg-white border border-gray-200 text-gray-900;
        position: absolute;
        top: 100%;
        left: 0;
        max-height: calc(100vh - 4rem);
        width: 15rem;
        font-size: 0.875rem;
        box-shadow: 0 0 14px rgba(0, 0, 0, 0.1);
        overflow-y: auto;
        z-index: 999;
        padding: 1.5rem 0;
        margin-left: -0.5rem;
        li {
            @apply cursor-pointer;
            display: block;
            font-size: 0.875rem;
            &:first-child > .menu {
                margin-top: 0;
            }
            &:hover {
                @apply text-violet-600;
                transition: color ease 0.4s;
                > .menu .p-i-icon {
                    @apply text-violet-600;
                    transition: color ease 0.4s;
                }
            }
            > .menu {
                @apply font-bold;
                display: block;
                line-height: 2rem;
                padding-left: 1.5rem;
                margin-top: 1.5rem;
                .p-i-icon {
                    @apply text-primary-dark;
                    margin-right: 0.25rem;
                }

                @media (hover: hover) {
                    &:hover {
                        @apply text-violet-500;
                        transition: color ease 0.4s;
                    }
                }
            }
            > .submenu {
                @apply text-gray-500;
                display: block;
                line-height: 1.75rem;
                padding-left: 3.5rem;

                @media (hover: hover) {
                    &:hover {
                        @apply text-violet-500;
                        transition: color ease 0.4s;
                    }
                }
            }
        }
    }

    &.disabled {
        .sitemap-button {
            cursor: not-allowed;
            opacity: 0.2;
            &:hover {
                @apply text-gray-900;
                opacity: 0.2;
            }
        }
    }
}
</style>
