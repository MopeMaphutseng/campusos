import { BadRequestException } from '@nestjs/common';
import { CampusLifeService } from '../campus-life.service';
import { CafeteriaMenu } from '../entities/cafeteria-menu.entity';
import { CafeteriaOrderStatus } from '../entities/cafeteria-order.entity';

const UNI = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const USER = 'd1c3f3cd-5d51-46af-b780-2a8ecdb3b3bb';
const MENU_ID = '11111111-1111-4111-8111-111111111111';
const MENU_ID_2 = '22222222-2222-4222-8222-222222222222';

function menu(overrides: Partial<CafeteriaMenu> = {}): CafeteriaMenu {
  return {
    id: MENU_ID,
    universityId: UNI,
    shopName: 'Cafeteria',
    itemName: 'Full Breakfast',
    price: 45,
    currency: 'LSL',
    isAvailable: true,
    ...overrides,
  } as CafeteriaMenu;
}

describe('CampusLifeService.createCafeteriaOrder', () => {
  let service: CampusLifeService;
  let orderRepo: any;
  let menuRepo: any;

  beforeEach(() => {
    menuRepo = { find: jest.fn() };
    orderRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ ...x, id: 'order-1' })),
    };
    service = new CampusLifeService(
      {} as any,
      orderRepo,
      menuRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('uses the DB price and ignores client-supplied price/name', async () => {
    menuRepo.find.mockResolvedValue([menu()]);

    const order = await service.createCafeteriaOrder(UNI, USER, {
      cafeteriaName: 'Evil',
      items: [{ menuItemId: MENU_ID, quantity: 2, price: 0.01, name: 'HACKED' } as any],
    });

    expect(order.totalAmount).toBe(90);
    expect(order.items).toEqual([
      { menuItemId: MENU_ID, name: 'Full Breakfast', quantity: 2, price: 45 },
    ]);
    expect(order.cafeteriaName).toBe('Cafeteria');
    expect(order.currency).toBe('LSL');
    expect(order.status).toBe(CafeteriaOrderStatus.PENDING);
    expect(order.universityId).toBe(UNI);
    expect(order.userId).toBe(USER);
  });

  it('rejects unknown or unavailable items', async () => {
    menuRepo.find.mockResolvedValue([]);
    await expect(
      service.createCafeteriaOrder(UNI, USER, {
        items: [{ menuItemId: MENU_ID, quantity: 1 } as any],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes the menu lookup to the university and available items', async () => {
    menuRepo.find.mockResolvedValue([menu()]);
    await service.createCafeteriaOrder(UNI, USER, {
      items: [{ menuItemId: MENU_ID, quantity: 1 } as any],
    });
    expect(menuRepo.find).toHaveBeenCalledWith({
      where: { id: expect.anything(), universityId: UNI, isAvailable: true },
    });
  });

  it('rejects invalid quantities', async () => {
    menuRepo.find.mockResolvedValue([menu()]);
    for (const quantity of [0, -1, 1.5, 101]) {
      await expect(
        service.createCafeteriaOrder(UNI, USER, {
          items: [{ menuItemId: MENU_ID, quantity } as any],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
  });

  it('rejects malformed menu ids', async () => {
    await expect(
      service.createCafeteriaOrder(UNI, USER, {
        items: [{ menuItemId: 'not-a-uuid', quantity: 1 } as any],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty orders', async () => {
    await expect(
      service.createCafeteriaOrder(UNI, USER, { items: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('derives a generic name for mixed-shop orders', async () => {
    menuRepo.find.mockResolvedValue([
      menu(),
      menu({ id: MENU_ID_2, shopName: 'Cafe', itemName: 'Tea', price: 10 }),
    ]);

    const order = await service.createCafeteriaOrder(UNI, USER, {
      items: [
        { menuItemId: MENU_ID, quantity: 1 } as any,
        { menuItemId: MENU_ID_2, quantity: 1 } as any,
      ],
    });

    expect(order.cafeteriaName).toBe('Campus Cafeteria');
    expect(order.totalAmount).toBe(55);
  });
});
