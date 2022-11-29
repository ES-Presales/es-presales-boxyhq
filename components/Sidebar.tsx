import { ShieldCheckIcon, UsersIcon, HomeIcon, LinkIcon, ListBulletIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';
import classNames from 'classnames';
import { useRouter } from 'next/router';

import Logo from '../public/logo.png';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

export const Sidebar = (props: { isOpen: boolean; setIsOpen: any; hideMenus?: boolean }) => {
  const { isOpen, setIsOpen } = props;
  const { t } = useTranslation('common');

  const { asPath } = useRouter();
  const [navOpen, setNavOpen] = useState({
    'Enterprise SSO': asPath.includes('/admin/sso-connection'),
    'Directory Sync': asPath.includes('/admin/directory-sync'),
    Dashboard: false,
  } as any);

  const menus = props.hideMenus
    ? []
    : [
        {
          href: '/admin/dashboard',
          text: 'Dashboard',
          icon: HomeIcon,
          active: asPath.includes('/admin/dashboard'),
        },
        {
          href: '/admin/sso-connection',
          text: 'Enterprise SSO',
          icon: ShieldCheckIcon,
          active: asPath.includes('/admin/sso-connection'),
          items: [
            {
              href: '/admin/sso-connection',
              text: 'Connections',
              icon: ListBulletIcon,
              active: asPath === '/admin/sso-connection',
            },
            {
              href: '/admin/sso-connection/setup-link',
              text: 'Setup Link',
              icon: LinkIcon,
              active: asPath.includes('/admin/sso-connection/setup-link'),
            },
          ],
        },
        {
          href: '/admin/directory-sync',
          text: 'Directory Sync',
          icon: UsersIcon,
          active: asPath.includes('/admin/directory-sync'),
          items: [
            {
              href: '/admin/directory-sync',
              text: 'Connections',
              icon: ListBulletIcon,
              active: asPath === '/admin/directory-sync',
            },
            {
              href: '/admin/directory-sync/setup-link',
              text: 'Setup Link',
              icon: LinkIcon,
              active: asPath.includes('/admin/directory-sync/setup-link'),
            },
          ],
        },
      ];

  return (
    <>
      <div
        className={classNames('relative z-40 md:hidden', { hidden: isOpen })}
        role='dialog'
        aria-modal='true'>
        <div className='fixed inset-0 bg-gray-600 bg-opacity-75' />
        <div className='fixed inset-0 z-40 flex'>
          <div className='relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4'>
            <div className='absolute top-0 right-0 -mr-12 pt-2'>
              <button
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
                type='button'
                className='ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'>
                <span className='sr-only'>{t('close_sidebar')}</span>
                <svg
                  className='h-6 w-6 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  aria-hidden='true'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <div className='flex flex-shrink-0 items-center px-4'>
              <Link href='/' className='flex items-center'>
                <Image src={Logo} alt='BoxyHQ' width={36} height={36} className='h-8 w-auto' />
                <span className='ml-4 text-xl font-bold text-gray-900'>BoxyHQ Admin Portal</span>
              </Link>
            </div>
            <div className='mt-5 h-0 flex-1 overflow-y-auto'>
              <nav className='space-y-1 px-2'>
                {menus.map((menu) => {
                  const hasSubMenu = menu.items ? (menu.items.length > 0 ? true : false) : false;
                  return (
                    <>
                      <Link
                        key={menu.text}
                        href={menu.href}
                        onClick={() => {
                          setNavOpen({
                            [menu.text]: navOpen[menu.text] ? false : true,
                          });
                        }}
                        className='group flex items-center rounded-md bg-gray-100 py-2 px-2 text-base font-medium text-gray-900'>
                        <menu.icon className='mr-4 h-6 w-6 flex-shrink-0' aria-hidden='true' />
                        {menu.text}
                      </Link>
                      {hasSubMenu && navOpen[menu.text] ? (
                        <nav key={`{menu.text}-nav`} className={`hide space-y-1 px-2`}>
                          {(menu.items || []).map((subMenu) => (
                            <Link
                              key={subMenu.text}
                              href={subMenu.href}
                              className='group flex items-center rounded-md bg-gray-100 py-2 px-2 text-base font-medium text-gray-900'>
                              <subMenu.icon className='mr-4 h-6 w-6 flex-shrink-0' aria-hidden='true' />
                              {subMenu.text}
                            </Link>
                          ))}
                        </nav>
                      ) : (
                        ''
                      )}
                    </>
                  );
                })}
              </nav>
            </div>
          </div>
          <div className='w-14 flex-shrink-0' aria-hidden='true'></div>
        </div>
      </div>
      <div className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col'>
        <div className='flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5'>
          <div className='flex flex-shrink-0 items-center px-4'>
            <Link href='/' className='flex items-center'>
              <Image src={Logo} alt='BoxyHQ' width={36} height={36} className='h-8 w-auto' />
              <span className='ml-4 text-lg font-bold text-gray-900'>BoxyHQ Admin Portal</span>
            </Link>
          </div>
          <div className='mt-5 flex flex-1 flex-col'>
            <nav className='flex-1 space-y-1 px-2 pb-4' id='menu'>
              {menus.map((menu) => {
                const hasSubMenu = menu.items ? (menu.items.length > 0 ? true : false) : false;
                return (
                  <>
                    <Link
                      key={menu.text}
                      href={menu.href}
                      onClick={() => {
                        setNavOpen({
                          [menu.text]: navOpen[menu.text] ? false : true,
                        });
                      }}
                      className={classNames(
                        'group flex items-center rounded-md px-2 py-2 text-sm text-gray-900',
                        menu.active ? 'bg-gray-100 font-bold' : 'font-medium'
                      )}>
                      <menu.icon className='mr-4 h-6 w-6 flex-shrink-0' aria-hidden='true' />
                      {menu.text}
                    </Link>
                    {hasSubMenu && navOpen[menu.text] ? (
                      <nav key={`{menu.text}-nav`} className='flex-1 space-y-1 px-2 pb-4' id='subMenu'>
                        {(menu.items || []).map((subMenu) => (
                          <Link
                            key={subMenu.text}
                            href={subMenu.href}
                            className={classNames(
                              'group flex items-center rounded-md px-2 py-2 text-sm text-gray-900',
                              subMenu.active ? 'bg-gray-100 font-bold' : 'font-medium'
                            )}>
                            <subMenu.icon className='mr-4 h-6 w-6 flex-shrink-0' aria-hidden='true' />
                            {subMenu.text}
                          </Link>
                        ))}
                      </nav>
                    ) : (
                      ''
                    )}
                  </>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};
