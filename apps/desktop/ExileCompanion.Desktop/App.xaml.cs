using ExileCompanion.Desktop.Models;
using ExileCompanion.Desktop.Repositories;
using ExileCompanion.Desktop.Services;
using ExileCompanion.Desktop.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using System.Windows;
using System.Diagnostics;

namespace ExileCompanion.Desktop
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        private ServiceProvider? _serviceProvider;

        protected override async void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            var services = new ServiceCollection();

            // Shared application data
            services.AddSingleton<CharacterService>();

            // ViewModels
            services.AddSingleton<DashboardViewModel>();
            services.AddSingleton<CharactersViewModel>();
            services.AddSingleton<MainViewModel>();

            // Main application window
            services.AddSingleton<MainWindow>();

            // Register the repository BEFORE building the provider
            services.AddSingleton<ICharacterRepository>(provider =>
            {
                string filePath = Path.Combine(
                    AppContext.BaseDirectory,
                    "character-fixtures.json");

                return new LocalCharacterRepository(filePath);
            });

            // Build the container after all registrations
            _serviceProvider = services.BuildServiceProvider();

            var characterService = _serviceProvider.GetRequiredService<CharacterService>();

            await characterService.LoadCharactersAsync(GameId.Poe1);

            var repository = _serviceProvider.GetRequiredService<ICharacterRepository>();


            var mainWindow = _serviceProvider
                .GetRequiredService<MainWindow>();

            MainWindow = mainWindow;
            mainWindow.Show();
        }

        protected override void OnExit(ExitEventArgs e)
        {
            _serviceProvider?.Dispose();
            base.OnExit(e);
        }


    }

}
