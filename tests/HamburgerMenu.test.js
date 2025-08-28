/**
 * @jest-environment jsdom
 */

import { HamburgerMenu } from '../js/components/HamburgerMenu.js';

describe('HamburgerMenu', () => {
    let hamburgerMenu;
    let container;

    beforeEach(() => {
        // Set up DOM
        document.body.innerHTML = '<div id="test-container"></div>';
        container = document.getElementById('test-container');
    });

    afterEach(() => {
        if (hamburgerMenu) {
            hamburgerMenu.destroy();
        }
        document.body.innerHTML = '';
    });

    describe('Constructor and Initialization', () => {
        test('creates hamburger menu with default options', async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
            
            expect(hamburgerMenu).toBeInstanceOf(HamburgerMenu);
            expect(hamburgerMenu.isOpen).toBe(false);
            expect(hamburgerMenu.options.position).toBe('top-right');
        });

        test('creates hamburger menu with custom options', async () => {
            const options = {
                position: 'top-left',
                color: '#ff0000',
                items: [
                    { label: 'Test Item', action: jest.fn() }
                ]
            };
            
            hamburgerMenu = await HamburgerMenu.create(container, options);
            
            expect(hamburgerMenu.options.position).toBe('top-left');
            expect(hamburgerMenu.options.color).toBe('#ff0000');
            expect(hamburgerMenu.options.items).toHaveLength(1);
        });
    });

    describe('Rendering', () => {
        beforeEach(async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
        });

        test('renders hamburger button and dropdown', () => {
            const button = hamburgerMenu.find('.hamburger-button');
            const dropdown = hamburgerMenu.find('.hamburger-dropdown');
            
            expect(button).toBeDefined();
            expect(dropdown).toBeDefined();
            expect(button.getAttribute('aria-expanded')).toBe('false');
        });

        test('renders menu items when provided', async () => {
            const items = [
                { label: 'Item 1', action: jest.fn() },
                { label: 'Item 2', href: '/test' },
                { label: 'Item 3', action: jest.fn(), icon: 'test-icon' }
            ];
            
            hamburgerMenu.destroy();
            hamburgerMenu = await HamburgerMenu.create(container, { items });
            
            const menuItems = hamburgerMenu.findAll('.hamburger-item');
            expect(menuItems).toHaveLength(3);
            
            expect(menuItems[0].textContent.trim()).toBe('Item 1');
            expect(menuItems[1].tagName).toBe('A');
            expect(menuItems[1].getAttribute('href')).toBe('/test');
        });

        test('applies position class correctly', async () => {
            hamburgerMenu.destroy();
            hamburgerMenu = await HamburgerMenu.create(container, { position: 'bottom-left' });
            
            const dropdown = hamburgerMenu.find('.hamburger-dropdown');
            expect(dropdown.classList.contains('position-bottom-left')).toBe(true);
        });
    });

    describe('Toggle Functionality', () => {
        beforeEach(async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
        });

        test('opens menu when toggle() is called', () => {
            hamburgerMenu.toggle();
            
            expect(hamburgerMenu.isOpen).toBe(true);
            
            const button = hamburgerMenu.find('.hamburger-button');
            const dropdown = hamburgerMenu.find('.hamburger-dropdown');
            
            expect(button.classList.contains('active')).toBe(true);
            expect(button.getAttribute('aria-expanded')).toBe('true');
            expect(dropdown.classList.contains('show')).toBe(true);
        });

        test('closes menu when toggle() is called again', () => {
            hamburgerMenu.open();
            hamburgerMenu.toggle();
            
            expect(hamburgerMenu.isOpen).toBe(false);
            
            const button = hamburgerMenu.find('.hamburger-button');
            const dropdown = hamburgerMenu.find('.hamburger-dropdown');
            
            expect(button.classList.contains('active')).toBe(false);
            expect(button.getAttribute('aria-expanded')).toBe('false');
            expect(dropdown.classList.contains('show')).toBe(false);
        });

        test('open() method opens menu', () => {
            hamburgerMenu.open();
            
            expect(hamburgerMenu.isOpen).toBe(true);
        });

        test('close() method closes menu', () => {
            hamburgerMenu.open();
            hamburgerMenu.close();
            
            expect(hamburgerMenu.isOpen).toBe(false);
        });
    });

    describe('Event Handling', () => {
        beforeEach(async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
        });

        test('toggles menu when button is clicked', () => {
            const button = hamburgerMenu.find('.hamburger-button');
            
            button.click();
            expect(hamburgerMenu.isOpen).toBe(true);
            
            button.click();
            expect(hamburgerMenu.isOpen).toBe(false);
        });

        test('closes menu when clicking outside', () => {
            hamburgerMenu.open();
            
            // Simulate clicking outside the component
            document.body.click();
            
            expect(hamburgerMenu.isOpen).toBe(false);
        });

        test('closes menu when pressing Escape key', () => {
            hamburgerMenu.open();
            
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(escapeEvent);
            
            expect(hamburgerMenu.isOpen).toBe(false);
        });

        test('handles menu item clicks', async () => {
            const mockAction = jest.fn();
            const items = [
                { label: 'Test Item', action: mockAction }
            ];
            
            hamburgerMenu.destroy();
            hamburgerMenu = await HamburgerMenu.create(container, { items });
            
            hamburgerMenu.open();
            
            const menuItem = hamburgerMenu.find('.hamburger-item');
            menuItem.click();
            
            expect(mockAction).toHaveBeenCalled();
            expect(hamburgerMenu.isOpen).toBe(false); // Should close after click
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(async () => {
            const items = [
                { label: 'Item 1', action: jest.fn() },
                { label: 'Item 2', action: jest.fn() },
                { label: 'Item 3', action: jest.fn() }
            ];
            hamburgerMenu = await HamburgerMenu.create(container, { items });
            hamburgerMenu.open();
        });

        test('navigates down with ArrowDown key', () => {
            const items = hamburgerMenu.findAll('.hamburger-item');
            items[0].focus();
            
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            items[0].dispatchEvent(downEvent);
            
            expect(document.activeElement).toBe(items[1]);
        });

        test('navigates up with ArrowUp key', () => {
            const items = hamburgerMenu.findAll('.hamburger-item');
            items[1].focus();
            
            const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            items[1].dispatchEvent(upEvent);
            
            expect(document.activeElement).toBe(items[0]);
        });

        test('wraps navigation at boundaries', () => {
            const items = hamburgerMenu.findAll('.hamburger-item');
            
            // Test wrapping down from last item
            items[2].focus();
            const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            items[2].dispatchEvent(downEvent);
            expect(document.activeElement).toBe(items[0]);
            
            // Test wrapping up from first item
            items[0].focus();
            const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            items[0].dispatchEvent(upEvent);
            expect(document.activeElement).toBe(items[2]);
        });

        test('activates item with Enter key', () => {
            const items = hamburgerMenu.findAll('.hamburger-item');
            const mockAction = hamburgerMenu.options.items[0].action;
            
            items[0].focus();
            
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            items[0].dispatchEvent(enterEvent);
            
            expect(mockAction).toHaveBeenCalled();
        });
    });

    describe('Accessibility', () => {
        beforeEach(async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
        });

        test('has proper ARIA attributes', () => {
            const button = hamburgerMenu.find('.hamburger-button');
            const dropdown = hamburgerMenu.find('.hamburger-dropdown');
            
            expect(button.getAttribute('aria-expanded')).toBe('false');
            expect(button.getAttribute('aria-haspopup')).toBe('true');
            expect(button.getAttribute('aria-controls')).toBe(dropdown.id);
            expect(dropdown.getAttribute('role')).toBe('menu');
        });

        test('updates ARIA attributes when opened/closed', () => {
            const button = hamburgerMenu.find('.hamburger-button');
            
            hamburgerMenu.open();
            expect(button.getAttribute('aria-expanded')).toBe('true');
            
            hamburgerMenu.close();
            expect(button.getAttribute('aria-expanded')).toBe('false');
        });

        test('menu items have proper role attributes', async () => {
            const items = [
                { label: 'Test Item', action: jest.fn() }
            ];
            
            hamburgerMenu.destroy();
            hamburgerMenu = await HamburgerMenu.create(container, { items });
            
            const menuItem = hamburgerMenu.find('.hamburger-item');
            expect(menuItem.getAttribute('role')).toBe('menuitem');
            expect(menuItem.getAttribute('tabindex')).toBe('-1');
        });
    });

    describe('Lifecycle Events', () => {
        test('emits open event when menu opens', async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
            
            const openSpy = jest.fn();
            hamburgerMenu.on('hamburger:open', openSpy);
            
            hamburgerMenu.open();
            
            expect(openSpy).toHaveBeenCalledWith(hamburgerMenu);
        });

        test('emits close event when menu closes', async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
            
            const closeSpy = jest.fn();
            hamburgerMenu.on('hamburger:close', closeSpy);
            
            hamburgerMenu.open();
            hamburgerMenu.close();
            
            expect(closeSpy).toHaveBeenCalledWith(hamburgerMenu);
        });

        test('emits item click events', async () => {
            const items = [
                { label: 'Test Item', action: jest.fn() }
            ];
            hamburgerMenu = await HamburgerMenu.create(container, { items });
            
            const itemClickSpy = jest.fn();
            hamburgerMenu.on('hamburger:itemClick', itemClickSpy);
            
            hamburgerMenu.open();
            const menuItem = hamburgerMenu.find('.hamburger-item');
            menuItem.click();
            
            expect(itemClickSpy).toHaveBeenCalledWith({
                item: items[0],
                element: menuItem,
                hamburger: hamburgerMenu
            });
        });
    });

    describe('Dynamic Item Management', () => {
        beforeEach(async () => {
            hamburgerMenu = await HamburgerMenu.create(container);
        });

        test('adds new items dynamically', () => {
            const newItem = { label: 'New Item', action: jest.fn() };
            
            hamburgerMenu.addItem(newItem);
            
            expect(hamburgerMenu.options.items).toContain(newItem);
            
            const menuItems = hamburgerMenu.findAll('.hamburger-item');
            expect(menuItems).toHaveLength(1);
            expect(menuItems[0].textContent.trim()).toBe('New Item');
        });

        test('removes items by index', () => {
            hamburgerMenu.addItem({ label: 'Item 1', action: jest.fn() });
            hamburgerMenu.addItem({ label: 'Item 2', action: jest.fn() });
            
            hamburgerMenu.removeItem(0);
            
            expect(hamburgerMenu.options.items).toHaveLength(1);
            expect(hamburgerMenu.options.items[0].label).toBe('Item 2');
        });

        test('clears all items', () => {
            hamburgerMenu.addItem({ label: 'Item 1', action: jest.fn() });
            hamburgerMenu.addItem({ label: 'Item 2', action: jest.fn() });
            
            hamburgerMenu.clearItems();
            
            expect(hamburgerMenu.options.items).toHaveLength(0);
            
            const menuItems = hamburgerMenu.findAll('.hamburger-item');
            expect(menuItems).toHaveLength(0);
        });
    });
});
