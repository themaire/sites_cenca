import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBy',
  pure: true,
  standalone: true
})
export class FilterByPipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, key?: string, value?: any): T[] {
    if (!items) return [];
    if (key === undefined) return items as T[];
    return (items as any[]).filter(item => {
      if (value === undefined) return Boolean(item[key]);
      return item[key] === value;
    }) as T[];
  }
}
