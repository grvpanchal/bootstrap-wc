import * as React from 'react';
import { createComponent } from '@lit/react';
import {
  BsAccordion,
  BsAccordionItem,
  BsAlert,
  BsBadge,
  BsBreadcrumb,
  BsButton,
  BsButtonGroup,
  BsCard,
  BsCloseButton,
  BsCollapse,
  BsDropdown,
  BsDropdownItem,
  BsFormCheck,
  BsFormLabel,
  BsFormText,
  BsInput,
  BsInputGroup,
  BsInputText,
  BsListGroup,
  BsListGroupItem,
  BsModal,
  BsNav,
  BsNavItem,
  BsNavbar,
  BsOffcanvas,
  BsPagination,
  BsPopover,
  BsProgress,
  BsRange,
  BsSelect,
  BsSpinner,
  BsTabs,
  BsTabPanel,
  BsTextarea,
  BsToast,
  BsToastContainer,
  BsTooltip,
} from '@bootstrap-wc/components';

export const Accordion = createComponent({ react: React, tagName: 'bs-accordion', elementClass: BsAccordion });
export const AccordionItem = createComponent({
  react: React,
  tagName: 'bs-accordion-item',
  elementClass: BsAccordionItem,
  events: { onToggle: 'bs-accordion-item-toggle' },
});
export const Alert = createComponent({
  react: React,
  tagName: 'bs-alert',
  elementClass: BsAlert,
  events: { onDismiss: 'bs-dismiss' },
});
export const Badge = createComponent({ react: React, tagName: 'bs-badge', elementClass: BsBadge });
export const Breadcrumb = createComponent({ react: React, tagName: 'bs-breadcrumb', elementClass: BsBreadcrumb });
export const Button = createComponent({
  react: React,
  tagName: 'bs-button',
  elementClass: BsButton,
  events: { onBsClick: 'bs-click' },
});
export const ButtonGroup = createComponent({ react: React, tagName: 'bs-button-group', elementClass: BsButtonGroup });
export const Card = createComponent({ react: React, tagName: 'bs-card', elementClass: BsCard });
export const CloseButton = createComponent({
  react: React,
  tagName: 'bs-close-button',
  elementClass: BsCloseButton,
  events: { onClose: 'bs-close' },
});
export const Collapse = createComponent({
  react: React,
  tagName: 'bs-collapse',
  elementClass: BsCollapse,
  events: {
    onShow: 'bs-show',
    onShown: 'bs-shown',
    onHide: 'bs-hide',
    onHidden: 'bs-hidden',
  },
});
export const Dropdown = createComponent({
  react: React,
  tagName: 'bs-dropdown',
  elementClass: BsDropdown,
  events: {
    onShow: 'bs-show',
    onShown: 'bs-shown',
    onHide: 'bs-hide',
    onHidden: 'bs-hidden',
  },
});
export const DropdownItem = createComponent({ react: React, tagName: 'bs-dropdown-item', elementClass: BsDropdownItem });
export const FormCheck = createComponent({
  react: React,
  tagName: 'bs-form-check',
  elementClass: BsFormCheck,
  events: { onChange: 'bs-change' },
});
export const FormLabel = createComponent({ react: React, tagName: 'bs-form-label', elementClass: BsFormLabel });
export const FormText = createComponent({ react: React, tagName: 'bs-form-text', elementClass: BsFormText });
export const Input = createComponent({
  react: React,
  tagName: 'bs-input',
  elementClass: BsInput,
  events: { onInput: 'bs-input', onChange: 'bs-change' },
});
export const InputGroup = createComponent({ react: React, tagName: 'bs-input-group', elementClass: BsInputGroup });
export const InputText = createComponent({ react: React, tagName: 'bs-input-text', elementClass: BsInputText });
export const ListGroup = createComponent({ react: React, tagName: 'bs-list-group', elementClass: BsListGroup });
export const ListGroupItem = createComponent({ react: React, tagName: 'bs-list-group-item', elementClass: BsListGroupItem });
export const Modal = createComponent({
  react: React,
  tagName: 'bs-modal',
  elementClass: BsModal,
  events: {
    onShow: 'bs-show',
    onShown: 'bs-shown',
    onHide: 'bs-hide',
    onHidden: 'bs-hidden',
  },
});
export const Nav = createComponent({ react: React, tagName: 'bs-nav', elementClass: BsNav });
export const NavItem = createComponent({ react: React, tagName: 'bs-nav-item', elementClass: BsNavItem });
export const Navbar = createComponent({ react: React, tagName: 'bs-navbar', elementClass: BsNavbar });
export const Offcanvas = createComponent({
  react: React,
  tagName: 'bs-offcanvas',
  elementClass: BsOffcanvas,
  events: {
    onShow: 'bs-show',
    onShown: 'bs-shown',
    onHide: 'bs-hide',
    onHidden: 'bs-hidden',
  },
});
export const Pagination = createComponent({
  react: React,
  tagName: 'bs-pagination',
  elementClass: BsPagination,
  events: { onPageChange: 'bs-page-change' },
});
export const Popover = createComponent({ react: React, tagName: 'bs-popover', elementClass: BsPopover });
export const Progress = createComponent({ react: React, tagName: 'bs-progress', elementClass: BsProgress });
export const Range = createComponent({
  react: React,
  tagName: 'bs-range',
  elementClass: BsRange,
  events: { onInput: 'bs-input' },
});
export const Select = createComponent({
  react: React,
  tagName: 'bs-select',
  elementClass: BsSelect,
  events: { onChange: 'bs-change' },
});
export const Spinner = createComponent({ react: React, tagName: 'bs-spinner', elementClass: BsSpinner });
export const Tabs = createComponent({
  react: React,
  tagName: 'bs-tabs',
  elementClass: BsTabs,
  events: { onTabChange: 'bs-tab-change' },
});
export const TabPanel = createComponent({ react: React, tagName: 'bs-tab-panel', elementClass: BsTabPanel });
export const Textarea = createComponent({
  react: React,
  tagName: 'bs-textarea',
  elementClass: BsTextarea,
  events: { onInput: 'bs-input', onChange: 'bs-change' },
});
export const Toast = createComponent({
  react: React,
  tagName: 'bs-toast',
  elementClass: BsToast,
  events: { onShow: 'bs-show', onHide: 'bs-hide' },
});
export const ToastContainer = createComponent({ react: React, tagName: 'bs-toast-container', elementClass: BsToastContainer });
export const Tooltip = createComponent({ react: React, tagName: 'bs-tooltip', elementClass: BsTooltip });

// Also export the element classes for advanced users (refs, instanceof checks).
export * from '@bootstrap-wc/components';
