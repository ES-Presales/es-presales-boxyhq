import classNames from 'classnames';

export const IconButton = ({ Icon, tooltip, onClick, className }) => {
  return (
    <div className='tooltip' data-tip={tooltip}>
      <Icon className={classNames('h-5 w-5 cursor-pointer text-secondary', className)} onClick={onClick} />
    </div>
  );
};
