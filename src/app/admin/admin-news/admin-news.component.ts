import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminService } from '../admin.service';
import { News } from '../../shared/interfaces/news';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { AdminNewsDialogComponent } from './newsDialog/admin-news-dialog.component';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.scss'
})
export class AdminNewsComponent implements OnInit {
  news: News[] = [];
  dataSource: MatTableDataSource<News> = new MatTableDataSource<News>([]);
  displayedColumns: string[] = ['titre', 'date_publication', 'publie', 'actions'];

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private overlay: Overlay,
  ) {}

  async fetch(): Promise<News[]> {
    return this.adminService.getAllNews();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.news = await this.fetch();
      this.dataSource = new MatTableDataSource<News>(this.news);
    } catch (e) {
      console.error('Erreur lors du chargement des actualités:', e);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openNewsDialog(row: News) {
    const dialogRef = this.dialog.open(AdminNewsDialogComponent, {
      width: '840px',
      data: { id: row.id },
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    dialogRef.afterClosed().subscribe({
      next: async () => {
        // Rafraîchir la liste après fermeture du dialogue
        this.news = await this.fetch();
        this.dataSource.data = this.news;
      }
    });
  }

  openNewNewsDialog(): void {
    const dialogRef = this.dialog.open(AdminNewsDialogComponent, {
      width: '840px',
      data: { id: null, isNew: true },
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });

    dialogRef.afterClosed().subscribe({
      next: async () => {
        this.news = await this.fetch();
        this.dataSource.data = this.news;
      }
    });
  }
}
