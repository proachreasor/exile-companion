using ExileCompanion.Desktop.Services;
using ExileCompanion.Desktop.ViewModels;
using System.Windows;

namespace ExileCompanion.Desktop;

/// <summary>
/// Interaction logic for MainWindow.xaml
/// </summary>
public partial class MainWindow : Window
{
    public MainWindow(MainViewModel mainViewModel)
    {
        InitializeComponent();

        DataContext = mainViewModel;

    }
}