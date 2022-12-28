import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { ButtonOutline } from './ButtonOutline';

type PaginationProps = {
  itemsCount: number;
  offset: number;
  onPrevClick: () => void;
  onNextClick: () => void;
};

export const pageLimit = 3;

export const Pagination = ({ itemsCount, offset, onPrevClick, onNextClick }: PaginationProps) => {
  const { t } = useTranslation('common');

  // Hide pagination if there are no items to paginate.
  if ((itemsCount === 0 && offset === 0) || (itemsCount < pageLimit && offset === 0)) {
    return null;
  }

  const prevDisabled = offset === 0;
  const nextDisabled = itemsCount < pageLimit || itemsCount === 0;

  return (
    <div className='flex justify-center space-x-4 py-4'>
      <ButtonOutline
        Icon={ArrowLeftIcon}
        aria-label={t('previous')}
        onClick={onPrevClick}
        disabled={prevDisabled}>
        {t('prev')}
      </ButtonOutline>
      <ButtonOutline
        Icon={ArrowRightIcon}
        aria-label={t('previous')}
        onClick={onNextClick}
        disabled={nextDisabled}>
        {t('next')}
      </ButtonOutline>
    </div>
  );
};
